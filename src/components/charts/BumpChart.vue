<script setup>
import { computed, ref, onMounted } from 'vue'
// import { useMapStore } from '../../store/mapStore';
import '../../assets/styles/globalStyles.css';

// const colors = ['#833ab4', '#8e3978', '#ae445a', '#8b3552', '#ca695a', '#e1875a', '#f39f5a'];
const colors = ['#ae445a', '#ca695a', '#f39f5a', '#8e3978', '#8b3552', '#e1875a'];

// register the four required props
const props = defineProps(['chart_config', 'activeChart', 'series', 'map_config'])
// const mapStore = useMapStore()

// Convert time to month
// const convertedData = props.series.map(category => {
// 	const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// 	const convertedCategory = {
// 		name: category.name,
// 		data: category.data.map(item => {
// 			const date = new Date(item.x);
// 			const monthAbbreviation = monthNames[date.getMonth()];
// 			return { y: item.y, x: monthAbbreviation };
// 		})
// 	};
// 	return convertedCategory;
// });
// console.log(convertedData);

let sortedData = [];
let max = props.series[0].data[0].y;
let min = props.series[0].data[0].y;
// Initialize sorTedData in the format of [{x, data}, {x, data}, ...]
// Errors occur if the data has different x's for different names
for (let j = 0;j < props.series[0].data.length; j++){
	sortedData = [...sortedData, {"x": props.series[0].data[j].x, "data": []}];
}
// Complete the sortedData
for (let i = 0; i < props.series.length; i++){
	for(let j = 0; j < props.series[i].data.length; j++){
		if (max < props.series[i].data[j].y) max = props.series[i].data[j].y;
		if (min > props.series[i].data[j].y) min = props.series[i].data[j].y;
		sortedData[j].data = [...sortedData[j].data, {"index": i, "name": props.series[i].name, "y": props.series[i].data[j].y}];
	}
}
for(let x = 0; x < sortedData.length; x++){
	sortedData[x].data.sort((a, b) => b.y - a.y);
}
// console.log(sortedData);

let total = [0];
for(let j = 0; j < sortedData[0].data.length; j++){
	total[0] += sortedData[0].data[j].y;
}
let totalMax = total[0];
let totalMin = total[0];
for(let i = 1; i < sortedData.length; i++){
	total = [...total, 0];
	for(let j = 0; j < sortedData[i].data.length; j++){
		total[i] +=  sortedData[i].data[j].y;
	}
	if(totalMax < total[i]) totalMax = total[i];
	if(totalMin > total[i]) totalMin = total[i];
}
// console.log(totalMin, totalMax, total);

const xnum = sortedData.length;
const ynum = sortedData[0].data.length;
// console.log(xnum, ynum);

// characteristics of the chart
let hei = 100 / totalMax;
let spcx = 90 / xnum;
let spcy = 6;
let rad = 15;
let totalLen = [];
for(let i = 0; i < sortedData.length; i++){
	totalLen = [...totalLen, ynum * 2 * rad + (ynum - 1) * spcy + total[i] * hei];
}
const totalLenMax = ynum * 2 * rad + (ynum - 1) * spcy + totalMax * hei;
// console.log(totalLen, totalLenMax);
let startPos = [];
for(let i = 0; i < xnum; i++){
	startPos = [...startPos, []];
	startPos[i] = [{x: i * (2 * rad + spcx), y: (totalLenMax - totalLen[i])/2}];
	for(let j = 1; j < ynum; j++){
		startPos[i] = [...startPos[i], {x: i * (2 * rad + spcx), y: startPos[i][j-1].y + 2 * rad + spcy + sortedData[i].data[j-1].y * hei}]
	}
}
// console.log(startPos);
const rectangles = Array.from({ length: xnum * ynum }, (_, index) => {
	const i = (index / ynum) | 0;
	const j = index % ynum;
	return {
		x: startPos[i][j].x,
		y: startPos[i][j].y,
		width: 2 * rad,
		height: 2 * rad + hei * sortedData[i].data[j].y,
		rx: rad, 
		ry: rad, 
		fill: colors[sortedData[i].data[j].index],
		number: sortedData[i].data[j].y,
		i: i,
		j: j,
		k: sortedData[i].data[j].index
	};
});
// console.log(rectangles);

const lines = Array.from({ length: xnum * ynum }, (_, index) => {
	const i = (index / ynum) | 0;
	const j = index % ynum;
	if(i == xnum - 1){
		return {
			x1: 0,
			y1: 0,
			x2: 0,
			y2: 0,
			stroke: "none",
		}
	}
	let ind = -1;
	for(let k = 0; k < ynum; k++){
		if(sortedData[i].data[j].index === sortedData[i+1].data[k].index){
			ind = k;
			break;
		}
	}
	return {
		x1: startPos[i][j].x + 2 * rad - 3,
		y1: startPos[i][j].y + rad + hei * sortedData[i].data[j].y / 2,
		x2: startPos[i+1][ind].x + 3,
		y2: startPos[i+1][ind].y + rad + hei * sortedData[i+1].data[ind].y / 2,
		stroke: colors[sortedData[i].data[j].index],
		i: i,
		j: j,
		k: sortedData[i].data[j].index
	};
});

const labels = Array.from({ length: xnum }, (_, index) => {	
	return {
		x: startPos[index][0].x + rad,
		y: totalLenMax + 30,
		text: sortedData[index].x
	};
});

const textwrapper = ref(null);
onMounted(() => {
	// Access the DOM element after the component is mounted
	textwrapper.value = document.querySelector('.textwrapper');
});

const legends = Array.from({ length: ynum }, (_, index) => {
	// const { width, height } = textwrapper.value ? textwrapper.value.getBoundingClientRect() : { width: 0, height: 0 };
	return {
		color: colors[index],
		text: props.series[index].name,
	};
});

const tooltipPosition = computed(() => {
	return { 'left': `${mousePosition.value.x - 10}px`, 'top': `${mousePosition.value.y - 54}px` };
});
const targetRect = ref(null);
const mousePosition = ref({ x: null, y: null });
function toggleActive(i) {
	// console.log('toggleActive called, ', i);
	targetRect.value = i;
}
function toggleActiveToNull() {
	// console.log('toggleActiveToNull called, ');
	targetRect.value = null;
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
	<div v-if="activeChart === 'BumpChart'" class="bumpchart">
		<div class="chartoutline">
			<div class="textwrapper">
				<div class="legends" v-for="(legend, index) in legends"
					:key="index" 
				>
					<svg class="svg-legend" style="width: 15px; height: 15px;">
						<rect width="15" height="15" :fill="legend.color" rx="4" ry="4"/>
					</svg>
					<div color="#888787"> {{ legend.text }} </div>
				</div>
			</div>
			<svg class="svg-container"
				:width="xnum * (2 * rad + spcx)"
				:height="totalLenMax + 35"
			>
				<line v-for="(line, index) in lines"
					:class="{ [`initial-animation-line-${line.k}-${line.i}`]: true }"
					:key="'line-' + index"
					:x1="line.x1 + spcx / 2"
					:y1="line.y1"
					:x2="line.x2 + spcx / 2"
					:y2="line.y2"
					:stroke="line.stroke"
					stroke-width="3"
					stroke-linecap="round"
				/>
				<rect v-for="(rect, index) in rectangles"
					:class="{ [`initial-animation-rect-${rect.k}-${rect.i}`]: true, 'datapoint': true }"
					:key="index" 
					:x="rect.x + spcx / 2"
					:y="rect.y" 
					:width="rect.width" 
					:height="rect.height" 
					:rx="rect.rx" 
					:ry="rect.ry" 
					:fill="rect.fill" 
					stroke="none" 
				/>
				<text v-for="(rect, index) in rectangles"
					:class="{ [`initial-animation-text-${rect.k}-${rect.i}`]: true, 'datapoint': true }"
					:key="'text-' + index" 
					:x="rect.x + rect.width / 2 + spcx / 2" 
					:y="rect.y + rect.height / 2" 
					text-anchor="middle" 
					alignment-baseline="middle" 
					fill="white" 
					font-size="12"
				>
					{{ rect.number }}
				</text>
				<rect v-for="(rect, index) in rectangles"
					:class="{ 'active-rect': targetRect === index || selectedIndex === index, [`initial-animation-${rect.i}-${rect.j}`]: true, 'datapoint-front': true }"
					:key="index" 
					:x="rect.x + spcx / 2"
					:y="rect.y" 
					:width="rect.width" 
					:height="rect.height" 
					:rx="rect.rx" 
					:ry="rect.ry" 
					@mouseenter="toggleActive(index)" 
					@mousemove="updateMouseLocation" 
					@mouseleave="toggleActiveToNull"
					@click="handleDataSelection(index)"
				/>
				<line 
					x1="0" 
					:y1="totalLenMax + 12" 
					x2="400px" 
					:y2="totalLenMax + 12"
					stroke="#888787"
					stroke-width=".5"
				/>
				<text v-for="(label, index) in labels"
					:key="'text-' + index" 
					:x="label.x + spcx / 2"
					:y="label.y"
					text-anchor="middle" 
					alignment-baseline="top" 
					fill="#888787"
					font-size="10"
				>
					{{ label.text }}
				</text>
			</svg>
		</div>
	</div>
	<Teleport to="body">
		<!-- The class "chart-tooltip" could be edited in /assets/styles/chartStyles.css -->
		<div v-if="targetRect !== null" class="bumpchart-chart-info chart-tooltip" :style="tooltipPosition">
			<h6>{{ sortedData[0].data[targetRect % ynum].name }}</h6>
			<span>{{ sortedData[(targetRect / ynum) | 0].x }} 排名第 {{ targetRect % ynum + 1 }}</span>
		</div>
	</Teleport>
</template>


<style scoped lang="scss">
.bumpchart {
    /* styles for the chart Vue component */
	display: flex;
	justify-content: center;
	align-items: center;
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
.chartoutline {
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	box-sizing: border-box;
	margin-top: .8vh;
	height: 100%;
	// border: 1px solid red;
}
.textwrapper {
	width: 80%;
	display: flex;
	flex-wrap: wrap;
	gap: 8px 14px;
	padding: 8px;
	justify-content: center;
	align-items: center;
	align-content: flex-start;
	// border: 1px solid green;
}
.legends {
	height: 15px;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: small;
	gap: 6px;
	cursor: pointer;
	// border: 1px solid red;
}
.svg-legend {
	display: flex;
	justify-content: center;
	align-items: center;
	// border: 1px solid blue;
}
.svg-container {
	overflow: scroll;
	// border: 1px solid blue;
}
.datapoint-front {
	fill: rgba(255, 255, 255, 0);
	transition: fill 0.4s ease;
}
.datapoint-front:hover {
	fill: rgba(255, 255, 255, .35);
}

@keyframes ease-in {
	0% {
		opacity: 0
	}
	;
	100% {
		opacity: 1
	}
}
@for $y from 0 through 100 {
	@for $x from 0 through 100 {
		.initial-animation-rect-#{$y}-#{$x} {
			animation-name: ease-in;
			animation-duration: 0.2s;
			animation-delay: 0.01s * ($y * 35 + $x * 7);
			animation-timing-function: linear;
			animation-fill-mode: forwards;
			opacity: 0;
		}
		.initial-animation-text-#{$y}-#{$x} {
			animation-name: ease-in;
			animation-duration: 0.2s;
			animation-delay: 0.01s * ($y * 35 + $x * 7);
			animation-timing-function: linear;
			animation-fill-mode: forwards;
			opacity: 0;
		}
		.initial-animation-line-#{$y}-#{$x} {
			animation-name: ease-in;
			animation-duration: 0.2s;
			animation-delay: 0.01s * ($y * 35 + $x * 7) + 0.08s;
			animation-timing-function: linear;
			animation-fill-mode: forwards;
			opacity: 0;
		}
	}
}

</style>