<script setup>
import { computed, ref } from 'vue'
// import { useMapStore } from '../../store/mapStore';

const colors = ['#537188', '#7c8e97', '#CBB279', '#E1D4BB', '#EEEEEE'];

// register the four required props
const props = defineProps(['chart_config', 'activeChart', 'series', 'map_config'])
// const mapStore = useMapStore()

let sortedData = props.series.map(series => ({
	...series,
	data: series.data.slice().sort((a, b) => a.y - b.y)
}));
// console.log(sortedData);

const xnum = sortedData.length;
const ynum = sortedData[0].data.length;

let max = sortedData[0].data[0].y;
let min = sortedData[0].data[0].y;
for(let i = 0; i < xnum; i++){
	for(let j = 0; j < ynum; j++){
		if(max < sortedData[i].data[j].y) max = sortedData[i].data[j].y;
		if(min > sortedData[i].data[j].y) min = sortedData[i].data[j].y;
	}
}

function percentile(arr, percentile) {
	let index = (percentile / 100) * (arr.length - 1);
	let lower = Math.floor(index);
	let upper = Math.ceil(index);
	if (lower === upper) {
		return arr[lower].y;
	} 
	else {
		let fraction = index - lower;
		return (1 - fraction) * arr[lower].y + fraction * arr[upper].y;
	}
}

let points = [100, 75, 50, 25, 0];
let percentiles = [[], [], [], [], []];
for(let k = 0; k < 5; k++){
	for(let i = 0; i < sortedData.length; i++){
		percentiles[k] = [...percentiles[k], percentile(sortedData[i].data, points[k])];
	}
}
// console.log(percentiles);

let totalHeight = 215;
let unitHeight = totalHeight / (max - min);
let wid = 35;
let shr = 6;
const boxes = Array.from({ length: xnum }, (_, index) => {	
	return {
		p100: (max - percentiles[0][index]) * unitHeight + 3,
		p75: (max - percentiles[1][index]) * unitHeight + 3,
		p50: (max - percentiles[2][index]) * unitHeight + 3,
		p25: (max - percentiles[3][index]) * unitHeight + 3,
		p0: (max - percentiles[4][index]) * unitHeight + 3,
	};
});

const tooltipPosition = computed(() => {
	return { 'left': `${mousePosition.value.x + 10}px`, 'top': `${mousePosition.value.y - 140}px` };
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
// Optional
// Required for charts that support map filtering
const selectedIndex = ref(null)
function handleDataSelection(index) {
	if (!props.chart_config.map_filter) {
		return;
	}
	if (index !== selectedIndex.value) {
		// mapStore.addLayerFilter(`${props.map_config[0].index}-${props.map_config[0].type}`, props.chart_config.map_filter[0], props.chart_config.map_filter[1][index]);
		selectedIndex.value = index;
	} else {
		// mapStore.clearLayerFilter(`${props.map_config[0].index}-${props.map_config[0].type}`);
		selectedIndex.value = null;
	}
}
</script>

<template>
    <!-- conditionally render the chart -->
    <div v-if="activeChart === 'BoxChart'" class="boxchart">
        <!-- The layout of the chart Vue component -->
        <!-- Utilize the @click event listener to enable map filtering by data selection -->
		<div class="boxesoutline">
			<div v-for="(box, index) in boxes"
				:class="{ 'active-box': targetBox === index || selectedIndex === index, [`initial-animation-${index}`]: true, 'box': true }"
				:key="index"
				@mouseenter="toggleActive(index)" 
				@mousemove="updateMouseLocation" 
				@mouseleave="toggleActiveToNull"
				@click="handleDataSelection(index)"
			>
				<svg class="svgoutline" :width="wid" :height="totalHeight">
					<line
						:class="{ 'easein': true, [`initial-animation-${index}`]: true }"
						:x1="wid / 2"
						:x2="wid / 2"
						:y1="box.p100"
						:y2="box.p75"
						stroke-linecap="round"
						stroke-width="2"
						:stroke="(targetBox === index || selectedIndex === index) ? colors[3] : colors[1]"
					/>
					<line
						:class="{ 'easein': true, [`initial-animation-${index}`]: true }"
						:x1="wid / 2"
						:x2="wid / 2"
						:y1="box.p25"
						:y2="box.p0"
						stroke-linecap="round"
						stroke-width="2"
						:stroke="(targetBox === index || selectedIndex === index) ? colors[3] : colors[1]"
					/>
					<line
						:class="{ 'easein': true, [`initial-animation-${index}`]: true }"
						:x1="0 + shr"
						:x2="wid - shr"
						:y1="box.p100"
						:y2="box.p100"
						stroke-linecap="round"
						stroke-width="3"
						:stroke="(targetBox === index || selectedIndex === index) ? colors[3] : colors[2]"
					/>
					<line
						:class="{ 'easein': true, [`initial-animation-${index}`]: true }"
						:x1="0 + shr"
						:x2="wid - shr"
						:y1="box.p0"
						:y2="box.p0"
						stroke-linecap="round"
						stroke-width="2"
						:stroke="(targetBox === index || selectedIndex === index) ? colors[3] : colors[2]"
					/>
					<rect 
						:class="{ 'easein': true, [`initial-animation-${index}`]: true }"
						x="2"
						:width="wid - 4"
						:y="box.p75"
						:height="box.p25 - box.p75"
						fill-opacity="0.5"
						stroke-width="2"
						:stroke="(targetBox === index || selectedIndex === index) ? colors[3] : colors[3]"
						:fill="(targetBox === index || selectedIndex === index) ? colors[2] : colors[0]"
					/>
					<line
						:class="{ 'easein': true, [`initial-animation-${index}`]: true }"
						:x1="0 + 3.5"
						:x2="wid - 3.5"
						:y1="box.p50"
						:y2="box.p50"
						stroke-linecap="round"
						stroke-width="2"
						:stroke="(targetBox === index || selectedIndex === index) ? colors[3] : colors[2]"
					/>
					<text 
						:x="wid/2"
						:y="max * unitHeight + 20"
						fill="#888787" 
						font-size="13"
						text-anchor="middle"
					>
						{{ sortedData[index].name }}
					</text>
				</svg>
			</div>		
		</div>
		<Teleport to="body">
			<!-- The class "chart-tooltip" could be edited in /assets/styles/chartStyles.css -->
			<div v-if="targetBox !== null" class="boxchart-chart-info chart-tooltip" :style="tooltipPosition">
				<h6>{{ sortedData[targetBox].name }}</h6>
				<span>最大值： {{ percentiles[0][targetBox] }}<br></span>
				<span>第三四分位數： {{ percentiles[1][targetBox] }}<br></span>
				<span>中位數： {{ percentiles[2][targetBox] }}<br></span>
				<span>第一四分位數： {{ percentiles[3][targetBox] }}<br></span>
				<span>最小值： {{ percentiles[4][targetBox] }}</span>
			</div>
		</Teleport>
    </div>
</template>

<style scoped lang="scss">
.boxchart {
    /* styles for the chart Vue component */
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	overflow: auto;
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
.boxesoutline {
	margin: 8px;
	display: flex;
	gap: 7px;
	justify-content: center;
	align-items: center;
	width: 100%;
	min-height: 200px;
}
.box {
	display: flex;
	justify-content: center;
	align-items: center;
	overflow: visible;
	// border: 1px solid red;
}
.svgoutline {
	padding: 5px;
	min-height: 240px;
	overflow: visible;
	// border: 1px solid blue;
}
.easein{
	transition: fill 0.3s ease;
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