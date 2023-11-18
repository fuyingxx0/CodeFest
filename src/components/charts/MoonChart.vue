<script setup>
import { computed, ref } from 'vue'
import { useMapStore } from '../../store/mapStore';

const colors = ['#dead5d', '#474747', '#5F5F5F', '#747373', '#888787'];

// register the four required props
const props = defineProps(['chart_config', 'activeChart', 'series', 'map_config'])
const mapStore = useMapStore()

let max = -1;
for(let i = 0; i < 12; i++){
	if(max < props.series[0].data[i]) max = props.series[0].data[i];
}
// console.log(max)

const R = 54;
const r = 18;
const centerx = 200;
const centery = 140;
let posCircle =[];
for(let i = 0; i < 12; i++) posCircle = [...posCircle, {x: centerx, y: centery}]
// console.log(posCircle)
for(let i = 0; i < 6; i++){
	const ang1 = Math.PI / 6 + i * Math.PI / 3;
	posCircle[i].x += R * Math.cos(ang1);
	posCircle[i].y += R * Math.sin(ang1);
	const ang2 = i * Math.PI / 3;
	posCircle[i+6].x += Math.sqrt(3) * R * Math.cos(ang2);
	posCircle[i+6].y += Math.sqrt(3) * R * Math.sin(ang2);
}
// console.log(posCircle)
const circles = Array.from({ length: 12 }, (_, index) => {
	// console.log(r * props.series[0].data[index] / max)
	return {
		cx: posCircle[index].x,
		cy: posCircle[index].y,
		r: r,
		d: `M ${posCircle[index].x} ${posCircle[index].y + r} A ${r} ${r} 0 0 1 ${posCircle[index].x} ${posCircle[index].y - r}`,
		rx: r * props.series[0].data[index] / max,
		overHalf: props.series[0].data[index] > max / 2
	};
});
const textMove = [
	{x: 38, y: 20},
	{x: 0, y: 32},
	{x: -38, y: 20},
	{x: -38, y: -20},
	{x: 0, y: -32},
	{x: 38, y: -20},
	{x: 43, y: 0},
	{x: 43, y: 5},
	{x: -43, y: 5},
	{x: -43, y: 0},
	{x: -43, y: -5},
	{x: 43, y: -5}
];

const tooltipPosition = computed(() => {
	return { 'left': `${mousePosition.value.x + 10}px`, 'top': `${mousePosition.value.y - 30}px` };
});
const targetMoon = ref(null);
const mousePosition = ref({ x: null, y: null });
function toggleActive(i) {
	// console.log('toggleActive called, ', i);
	targetMoon.value = i;
}
function toggleActiveToNull() {
	// console.log('toggleActiveToNull called, ');
	targetMoon.value = null;
}
function updateMouseLocation(e) {
	mousePosition.value.x = e.pageX;
	mousePosition.value.y = e.pageY;
}
// Optional
// Required for charts that support map filtering
const selectedIndex = ref(null)
function handleDataSelection(index) {
	if (!props.chart_config.map_filter) {
		return;
	}
	if (index !== selectedIndex.value) {
		mapStore.addLayerFilter(`${props.map_config[0].index}-${props.map_config[0].type}`, props.chart_config.map_filter[0], props.chart_config.map_filter[1][index]);
		selectedIndex.value = index;
	} else {
		mapStore.clearLayerFilter(`${props.map_config[0].index}-${props.map_config[0].type}`);
		selectedIndex.value = null;
	}
}
</script>

<template>
    <!-- conditionally render the chart -->
    <div v-if="activeChart === 'MoonChart'" class="moonchart">
        <!-- The layout of the chart Vue component -->
        <!-- Utilize the @click event listener to enable map filtering by data selection -->
		<div class="boxesoutline">
			<svg class="svg-wrapper">
				<g v-for="(circle, index) in circles">
					<line 
						:x1="circle.cx"
						:y1="circle.cy"
						:x2="centerx"
						:y2="centery"
						:stroke="colors[3]"
						stroke-width="2"
					/>
					<circle 
						:cx="circle.cx"
						:cy="circle.cy"
						:r="circle.r"
						:fill="colors[0]"
					/>
					<path
						:d="circle.d"
						:fill="colors[1]"
					/>
					<ellipse 
						:cx="circle.cx"
						:cy="circle.cy"
						:rx="circle.rx"
						:ry="circle.r"
						:fill="circle.overHalf ? colors[0] : colors[1]"
					/>
					<circle 
						class="circle-top"
						:cx="circle.cx"
						:cy="circle.cy"
						:r="circle.r"
						:fill="`rgba(0, 0, 0, 0)`"
						:stroke="colors[3]"
						stroke-width="3"
						cursor="pointer"
						@mouseenter="toggleActive(index)"
						@mousemove="updateMouseLocation"
						@mouseleave="toggleActiveToNull"
						@click="handleDataSelection(index)"
					/>
					<text
						class="label"
						:x="circle.cx + textMove[index].x"
						:y="circle.cy + textMove[index].y"
						text-anchor="middle"
						alignment-baseline="middle"
						font-size="12"
						:fill="colors[4]"
					>
						{{ props.chart_config.categories[index] }}
					</text>
				</g>
				<circle 
					:cx="centerx"
					:cy="centery"
					:r="8"
					:fill="colors[1]"
					:stroke="colors[2]"
					:stroke-width="2"
				/>
			</svg>
		</div>
		<Teleport to="body">
			<!-- The class "chart-tooltip" could be edited in /assets/styles/chartStyles.css -->
			<div v-if="targetMoon !== null" class="moonchart-chart-info chart-tooltip" :style="tooltipPosition">
				<h6>{{ props.series[0].data[targetMoon] }} {{ props.chart_config.unit }}</h6>
			</div>
		</Teleport>
    </div>
</template>

<style scoped lang="scss">
.moonchart {
    /* styles for the chart Vue component */
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	overflow: scroll;
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
.svg-wrapper {
	width: 400px;
	min-height: 250px;
	overflow: scroll;
}
.circle-top:hover {
	transition: all 0.2s ease;
	fill: #d0c8ab;
	opacity: 0.4;
	stroke: #decd90;
	stroke-width: 5px;
}
/* Animation styles aren't required but recommended */
@keyframes ease-in {
	0% {
		opacity: 0
	}
	;
	100% {
		opacity: 1
	}
}
@for $i from 0 through 20 {
	.initial-animation-#{$i} {
		animation-name: ease-in;
		animation-duration: 0.3s;
		animation-delay: 0.1s * $i;
		animation-timing-function: linear;
		animation-fill-mode: forwards;
		opacity: 0;
	}
}

</style>