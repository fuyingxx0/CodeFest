<script setup>
import { computed, ref } from 'vue'
import { useMapStore } from '../../store/mapStore';
import { transform } from '@vue/compiler-core';

const colors = ['#ae445a', '#ca695a', '#f39f5a', '#8e3978', '#8b3552', '#e1875a'];

// register the four required props
const props = defineProps(['chart_config', 'activeChart', 'series', 'map_config'])
const mapStore = useMapStore()

// Optional
// Required for charts that support map filtering
const selectedIndex = ref(null)

function handleDataSelection(index) {
	// Refer to the codebase for the complete function
    
}

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
console.log(percentiles);

let unitHeight = 2.4;
let wid = 35;
const boxes = Array.from({ length: xnum }, (_, index) => {	
	return {
		p100: (max - percentiles[0][index]) * unitHeight,
		p75: (max - percentiles[1][index]) * unitHeight,
		p50: (max - percentiles[2][index]) * unitHeight,
		p25: (max - percentiles[3][index]) * unitHeight,
		p0: (max - percentiles[4][index]) * unitHeight,
	};
});

</script>

<template>
    <!-- conditionally render the chart -->
    <div v-if="activeChart === 'BoxChart'" class="boxchart">
        <!-- The layout of the chart Vue component -->
        <!-- Utilize the @click event listener to enable map filtering by data selection -->
		<div class="boxesoutline">
			<div class="box" v-for="(box, index) in boxes"
				:key="index"
			>
				<svg class="svgoutline" :width="wid">
					<line
						:x1="wid / 2"
						:x2="wid / 2"
						:y1="box.p100"
						:y2="box.p75"
						stroke-linecap="round"
						stroke-width="2"
						:stroke="colors[0]"
					/>
					<line
						:x1="wid / 2"
						:x2="wid / 2"
						:y1="box.p25"
						:y2="box.p0"
						stroke-linecap="round"
						stroke-width="2"
						:stroke="colors[0]"
					/>
					<line
						x1="0"
						:x2="wid"
						:y1="box.p100"
						:y2="box.p100"
						stroke-linecap="round"
						stroke-width="2"
						:stroke="colors[2]"
					/>
					<line
						x1="0"
						:x2="wid"
						:y1="box.p50"
						:y2="box.p50"
						stroke-linecap="round"
						stroke-width="2"
						:stroke="colors[1]"
					/>
					<line
						x1="0"
						:x2="wid"
						:y1="box.p0"
						:y2="box.p0"
						stroke-linecap="round"
						stroke-width="2"
						:stroke="colors[2]"
					/>
					<rect 
						x="0"
						:width="wid"
						:y="box.p75"
						:height="box.p25 - box.p75"
						rx="5"
						ry="5"
						fill="none"
						fill-opacity="0.5"
						stroke-width="2"
						:stroke="colors[5]"
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
		<div style="overflow: visible;">
			<svg style="overflow: visible;">
				<line
					:transform="`translate(${0}, ${-42})`"
					:x1="0"
					:x2="300"
					y1="0"
					y2="0"
					stroke-linecap="round"
					stroke="#888787"
				/>
			</svg>	
		</div>
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
}
.boxesoutline {
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
	// border: 1px solid red;
}
.svgoutline {
	padding: 10px;
	min-height: 260px;
	overflow: auto;
	// border: 1px solid blue
}
/* Animation styles aren't required but recommended */
</style>