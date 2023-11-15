<script setup>
import { computed, ref } from 'vue'
// import { useMapStore } from '../../store/mapStore';

const colors = ['#284558', '#af823c', "#ecd0a5"];
function interpolateColor(color1, color2, weight) {
	const parseColor = (color) => {
		const hex = color.slice(1);
		return {
			r: parseInt(hex.slice(0, 2), 16),
			g: parseInt(hex.slice(2, 4), 16),
			b: parseInt(hex.slice(4, 6), 16),
		};
	};
	const interpolate = (c1, c2, weight) => {
		const interpolateChannel = (c1, c2, weight) =>
			Math.round(c1 + (c2 - c1) * weight);
		return {
			r: interpolateChannel(c1.r, c2.r, weight),
			g: interpolateChannel(c1.g, c2.g, weight),
			b: interpolateChannel(c1.b, c2.b, weight),
		};
	};
	const color1RGB = parseColor(color1);
	const color2RGB = parseColor(color2);
	const interpolatedColor = interpolate(color1RGB, color2RGB, weight);
	return `rgb(${interpolatedColor.r},${interpolatedColor.g},${interpolatedColor.b})`;
}

// register the four required props
const props = defineProps(['chart_config', 'activeChart', 'series', 'map_config'])
// const mapStore = useMapStore()

const num = props.series.length;
let lnum = 0;
for(let i = 0; i < num; i++){
	if(lnum < props.series[i]['data'][1]) lnum = props.series[i]['data'][1];
}

// data will be a tree
let data = {
	"name": props.series[0].name,
	"index": props.series[0].data[0],
	"layer": props.series[0].data[1],
	"parent": props.series[0].data[2],
	"value": props.series[0].data[3],
	"children": [],
	"count": 0
};
function initialization(i, p){
	if(p.index === props.series[i].data[2]){
		p.children = [...p.children, {
			"name": props.series[i].name,
			"index": props.series[i].data[0],
			"layer": props.series[i].data[1],
			"parent": props.series[i].data[2],
			"value": props.series[i].data[3],
			"children": [],
			"count": 0
		}];
		return true;
	}
	for(let j = 0; j < p['children'].length; j++){
		initialization(i, p['children'][j]);
	}
}
for(let i = 1; i < num; i++){
	initialization(i, data);
}
// console.log(data);

// function dfs(parent){
// 	console.log(parent['index']);
// 	if (parent['children'] && parent['children'].length > 0) {
// 		for (let i = 0; i < parent['children'].length; i++) {
// 			dfs(parent['children'][i]);
// 		}
// 	}
// }
// dfs(data);

// function bfs(parent) {
// 	const queue = [parent];
// 	while (queue.length > 0) {
// 		const current = queue.shift();
// 		console.log(current)
// 		if (current.children && current.children.length > 0) {
// 			queue.push(...current.children);
// 		}
// 	}
// 	return;
// }
// bfs(data);

function countCalc(parent){
	if(!parent['children'] || parent['children'].length === 0) {
		parent['count'] = 0;
		return 1;
	}
	let count = parent['children'].length;
	for (let i = 0; i < parent['children'].length; i++) {
		const result = countCalc(parent['children'][i]);
		if (count < result) count = result;
	}
	parent['count'] = count;
	return count;
}
countCalc(data);
// console.log(data);

// calculate angle
let ang = [{
	"index": 0,
	"minAng": 0 - 180 / data['children'].length,
	"maxAng": 360 - 180 / data['children'].length
}];
// let sizeFac = .8;
// let countFac = 3;
function angCalc(parent, minAng, maxAng) {
	let list = [];
	for(let i = 0; i < parent['children'].length; i++){
		list = [...list, {
			"index": parent['children'][i]['index'],
			"minAng": minAng + i * ((maxAng - minAng) / parent['children'].length),
			"maxAng": minAng + (i + 1) * ((maxAng - minAng) / parent['children'].length)
		}];
	}
	ang = [...ang, ...list];
	for(let i = 0; i < parent['children'].length; i++){
		if(parent['children'][i]['children'].length) angCalc(parent['children'][i], list[i]['minAng'], list[i]['maxAng']);
	}
}
angCalc(data, ang[0]['minAng'], ang[0]['maxAng']);
ang = ang.sort((a, b) => a.index - b.index);
// console.log(ang);

// calculate radius
let rad = [];
let radFac = 34 / data['value'];
let radMin = 12;
function radCalc(node) {
	rad = [...rad, {
		"index": node['index'],
		"rad": node['value'] / 2 * radFac + radMin
	}];
	for(let i = 0; i < node['children'].length; i++){
		if(node['children'].length) radCalc(node['children'][i]);
	}
}
radCalc(data);
rad = rad.sort((a, b) => a.index - b.index);
// console.log(rad);

// calculate position
const width = 300;
const center = {"x": width / 2, "y": 140};
const dist = 5;
let pos = [{
	"index": 0,
	"x": center.x,
	"y": center.y,
	"r": rad[0]['rad']
}];
function posCalc (parent, pcx, pcy){
	if (parent['children'] && parent['children'].length > 0) {
		for (let i = 0; i < parent['children'].length; i++) {
			const { index } = parent['children'][i];
			const a = (ang[index]['maxAng'] + ang[index]['minAng']) / 2;
			const x = pcx + ((rad[index]['rad'] + rad[props.series[parent['index']].data[2]]['rad']) + dist) * Math.cos(a * Math.PI / 180);
			const y = pcy - ((rad[index]['rad'] + rad[props.series[parent['index']].data[2]]['rad']) + dist) * Math.sin(a * Math.PI / 180);
			pos = [...pos, {
				"index": index,
				"x": x,
				"y": y,
				"r": rad[index]['rad']
			}];
			posCalc(parent['children'][i], x, y);
		}
	}
}
posCalc(data, center.x, center.y);
pos = pos.sort((a, b) => a.index - b.index);
// console.log(pos)

const circles = Array.from({ length: num }, (_, index) => {	
	return {
		cx: pos[index]['x'],
		cy: pos[index]['y'],
		r: pos[index]['r'],
		x1: pos[props.series[index].data[2]]['x'],
		y1: pos[props.series[index].data[2]]['y']
	};
});

const tooltipPosition = computed(() => {
	return { 'left': `${mousePosition.value.x - 10}px`, 'top': `${mousePosition.value.y - 55}px` };
});
const targetBox = ref(null);
const mousePosition = ref({ x: null, y: null });
function toggleActive(i) {
	// console.log('toggleActive called, ', i);
	targetBox.value = i;
}
function toggleActiveToNull() {
	// console.log('toggleActiveToNull called, ');
	targetBox.value = null;
}
function updateMouseLocation(e) {
	mousePosition.value.x = e.pageX;
	mousePosition.value.y = e.pageY;
}

</script>

<template>
    <!-- conditionally render the chart -->
    <div v-if="activeChart === 'CircularDendrogram'" class="circulardendrogram">
        <!-- The layout of the chart Vue component -->
        <!-- Utilize the @click event listener to enable map filtering by data selection -->
		<svg class="svg-container" :width="width">
			<line v-for="(circle, index) in circles" :key="index"
				:class="{ [`initial-animation-line-${index}`]: true }"
				:x1="circle.x1"
				:y1="circle.y1"
				:x2="circle.cx"
				:y2="circle.cy"
				:stroke-width="1.5"
				:stroke="colors[2]"
			/>
			<g v-for="(circle, index) in circles" :key="index">
				<circle 
					:class="{ [`initial-animation-${index}`]: true }"
					:cx="circle.cx"
					:cy="circle.cy"
					:r="circle.r"
					:fill="(interpolateColor(colors[0], colors[1], index / props.series.length))"
				/>
				<text
					:class="{ [`initial-animation-${index}`]: true }"
					:x="circle.cx"
					:y="circle.cy"
					text-anchor="middle"
					alignment-baseline="middle" 
					fill="white"
					font-size="11"
				>
					{{ props.series[index].name }}
					<!-- {{ props.series[index].data[3] }} -->
				</text>			
				<circle 
					class="circle-top"
					:cx="circle.cx"
					:cy="circle.cy"
					:r="circle.r"
					:fill="targetBox === index ? `rgba(255, 255, 255, .35)` : `rgba(255, 255, 255, 0)`"
					:stroke="targetBox === index ? colors[2] : `rgba(255, 255, 255, 0)`"
					@mouseenter="toggleActive(index)" 
					@mousemove="updateMouseLocation" 
					@mouseleave="toggleActiveToNull"
					@click="handleDataSelection(index)"
				/>
			</g>			
		</svg>
		<Teleport to="body">
			<!-- The class "chart-tooltip" could be edited in /assets/styles/chartStyles.css -->
			<div v-if="targetBox !== null" class="circulardendrogram-chart-info chart-tooltip" :style="tooltipPosition">
				<h6>{{ props.series[targetBox].name }}</h6>
				<span>{{ props.series[targetBox].data[3] }} {{ props.chart_config.unit }}</span>
			</div>
		</Teleport>
    </div>
</template>

<style scoped lang="scss">
.circulardendrogram {
    /* styles for the chart Vue component */
	display: flex;
	justify-content: center;
	&-chart {
		display: flex;
		justify-content: center;
		svg {
			width: 50%;
			path {
				transition: transform 0.2s;
				opacity: 0;
			}
		}
		&-info {
			position: fixed;
			z-index: 20;
		}
	}
}
.svg-container {
	min-height: 250px;
	overflow: scroll;
}
.circle-top{
	transition: fill 0.4s ease, stroke 0.3s ease;
}

@for $i from 0 through 100 {
	.initial-animation-#{$i} {
		@keyframes ease-in-#{$i} {
			0% {
				opacity: 0;
			}
			100% {
				opacity: 1;
			}
		}
		animation-name: ease-in-#{$i};
		animation-duration: 0.3s;
		animation-delay: 0.1s * $i;
		animation-timing-function: cubic-bezier(0.445, 0.05, 0.55, 0.95);
		animation-fill-mode: forwards;
		opacity: 0;
	}
	.initial-animation-line-#{$i} {
		@keyframes ease-in-line-#{$i} {
			0% {
				opacity: 0;
			}
			100% {
				opacity: 1;
			}
		}
		animation-name: ease-in-line-#{$i};
		animation-duration: 0.3s;
		animation-delay: 0.1s * $i + 0.06s;
		animation-timing-function: cubic-bezier(0.445, 0.05, 0.55, 0.95);
		animation-fill-mode: forwards;
		opacity: 0;
	}
}
/* Animation styles aren't required but recommended */
</style>