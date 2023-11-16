<script setup>
import { computed, ref, onMounted } from 'vue'
// import { useMapStore } from '../../store/mapStore';
import '../../assets/styles/globalStyles.css';

// const colors = ['#833ab4', '#8e3978', '#ae445a', '#8b3552', '#ca695a', '#e1875a', '#f39f5a'];
const colors = ['#ae445a', '#ca695a', '#f39f5a', '#8e3978', '#8b3552', '#e1875a'];

// register the four required props
const props = defineProps(['chart_config', 'activeChart', 'series', 'map_config'])
// const mapStore = useMapStore()

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

const showedLegend = ref(Array(sortedData[0].data.length).fill(true));
const activeLegend = ref(null);
// console.log(showedLegend.value)

//compute totalMax and totalMin
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
let spcx = 140 / xnum;
let spcy = 6;
let rad = 15;
function calcTotalLen(){
	let total = [0];
	for(let j = 0; j < sortedData[0].data.length; j++){
		total[0] += sortedData[0].data[j].y;
	}
	let totalMax = total[0];
	let totalMin = total[0];
	for(let i = 1; i < sortedData.length; i++){
		total = [...total, 0];
		for(let j = 0; j < sortedData[i].data.length; j++){
			if(showedLegend.value[sortedData[i].data[j].index]) total[i] +=  sortedData[i].data[j].y;
		}
		if(totalMax < total[i]) totalMax = total[i];
		if(totalMin > total[i]) totalMin = total[i];
	}
	let totalLen = [];
	let showedYnum = 0;
	for(let i = 0; i < showedLegend.value.length; i++) if(showedLegend.value[i]) showedYnum++;
	for(let i = 0; i < sortedData.length; i++){
		totalLen = [...totalLen, showedYnum * 2 * rad + (showedYnum - 1) * spcy + total[i] * hei];
	}
	return totalLen;
}
function calcTotalLenMax(){
	let total = [0];
	for(let j = 0; j < sortedData[0].data.length; j++){
		total[0] += sortedData[0].data[j].y;
	}
	let totalMax = total[0];
	let totalMin = total[0];
	for(let i = 1; i < sortedData.length; i++){
		total = [...total, 0];
		for(let j = 0; j < sortedData[i].data.length; j++){
			if(showedLegend.value[sortedData[i].data[j].index]) total[i] +=  sortedData[i].data[j].y;
		}
		if(totalMax < total[i]) totalMax = total[i];
		if(totalMin > total[i]) totalMin = total[i];
	}
	let showedYnum = 0;
	for(let i = 0; i < showedLegend.value.length; i++) if(showedLegend.value[i]) showedYnum++;
	const totalLenMax = showedYnum  * 2 * rad + (showedYnum - 1) * spcy + totalMax * hei;
	// console.log(totalLenMax);
	return totalLenMax;
}
const totalLenMax = ref(calcTotalLenMax());
function calcStartPos(){
	const totalLen = calcTotalLen();
	const totalLenMax = calcTotalLenMax();
	console.log(totalLen, totalLenMax)
	let startPos = [];
	for(let i = 0; i < xnum; i++){
		startPos = [...startPos, []];
		let accumulatedY = (totalLenMax - totalLen[i]) / 2;
		if(showedLegend.value[sortedData[i].data[0].index]){
			startPos[i] = [...startPos[i], {x: i * (2 * rad + spcx), y: accumulatedY}]
			accumulatedY +=  2 * rad + spcy + sortedData[i].data[0].y * hei;
		}
		else {
			startPos[i] = [...startPos[i], {x: -1, y: -1}]
		}
		for(let j = 1; j < ynum; j++){
			if(showedLegend.value[sortedData[i].data[j].index]){
				startPos[i] = [...startPos[i], {x: i * (2 * rad + spcx), y: accumulatedY}]
				accumulatedY +=  2 * rad + spcy + sortedData[i].data[j].y * hei;
			}
			else {
				startPos[i] = [...startPos[i], {x: -1, y: -1}]
			}		
		}
	}
	return startPos;
}
const showedStartPos = ref(calcStartPos());
// console.log(showedStartPos.value)

// console.log(startPos);
const rectangles = Array.from({ length: xnum * ynum }, (_, index) => {
	const i = (index / ynum) | 0;
	const j = index % ynum;
	return {
		// x: showedStartPos.value[i][j].x,
		// y: showedStartPos.value[i][j].y,
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

// const lines = Array.from({ length: xnum * ynum }, (_, index) => {
// 	const i = (index / ynum) | 0;
// 	const j = index % ynum;
// 	if(i == xnum - 1){
// 		return {
// 			x1: 0,
// 			y1: 0,
// 			x2: 0,
// 			y2: 0,
// 			stroke: "none",
// 		}
// 	}
// 	let ind = -1;
// 	for(let k = 0; k < ynum; k++){
// 		if(sortedData[i].data[j].index === sortedData[i+1].data[k].index){
// 			ind = k;
// 			break;
// 		}
// 	}
// 	return {
// 		x1: showedStartPos.value[i][j].x + 2 * rad - 3,
// 		y1: showedStartPos.value[i][j].y + rad + hei * sortedData[i].data[j].y / 2,
// 		x2: showedStartPos.value[i+1][ind].x + 3,
// 		y2: showedStartPos.value[i+1][ind].y + rad + hei * sortedData[i+1].data[ind].y / 2,
// 		stroke: colors[sortedData[i].data[j].index],
// 		i: i,
// 		j: j,
// 		k: sortedData[i].data[j].index
// 	};
// });

// const labels = Array.from({ length: xnum }, (_, index) => {	
// 	return {
// 		x: showedStartPos.value[index][0].x + rad,
// 		// y: totalLenMax + 30,
// 		y: 0,
// 		text: showedStartPos.value[index].x
// 	};
// });

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

function toggleActiveLegend(y){
	activeLegend.value = y;
}
function toggleActiveLegendToNull(){
	activeLegend.value = null;
}
function handleLegendSelection(y){
	showedLegend.value[y] = !showedLegend.value[y];
	showedStartPos.value = calcStartPos()
	totalLenMax.value = calcTotalLenMax()
	// console.log(showedLegend.value, showedStartPos.value)
}

function returnshowedStartPos(index){
	const i = (index / ynum) | 0;
	const j = index % ynum;
	return {
		x: showedStartPos.value[i][j].x,
		y: showedStartPos.value[i][j].y
	};
}

</script>

<template>
	<div v-if="activeChart === 'RowBumpChart'" class="rowbumpchart">
		<div class="chartoutline">
			<div class="textwrapper">
				<div class="legends" v-for="(legend, index) in legends"
					:key="index"
					@mouseenter="toggleActiveLegend(index)" 
					@mouseleave="toggleActiveLegendToNull"
					@click="handleLegendSelection(index)"
				>
					<svg class="svg-legend" style="width: 15px; height: 15px;">
						<rect width="15" height="15" :fill="legend.color" rx="4" ry="4"/>
					</svg>
					<div color="#888787"> {{ legend.text }} </div>
				</div>
			</div>
			<!-- <svg class="svg-container"
				:width="xnum * (2 * rad + spcx)"
				:height="totalLenMax + 35"
			> -->
			<svg class="svg-container"
				:width="xnum * (2 * rad + spcx)"
				:height="350"
			>
				<!-- connecting lines -->
				<!-- <line v-for="(line, index) in lines"
				:class="{ [`initial-animation-line-${line.k}-${line.i}`]: true }"
					:key="'line-' + index"
					:x1="line.x1 + spcx / 2"
					:y1="line.y1"
					:x2="line.x2 + spcx / 2"
					:y2="line.y2"
					:stroke="line.stroke"
					stroke-width="3"
					stroke-linecap="round"
				/> -->
				<!-- solid rectangles -->
				<rect v-for="(rect, index) in rectangles"
					:class="{ [`initial-animation-rect-${rect.k}-${rect.i}`]: true, 'datapoint': true }"
					:key="index" 
					:x="returnshowedStartPos(index).x + spcx / 2"
					:y="returnshowedStartPos(index).y" 
					:width="rect.width" 
					:height="rect.height" 
					:rx="rect.rx" 
					:ry="rect.ry" 
					:fill="returnshowedStartPos(index).x !== -1 ? rect.fill : `rgba(255, 255, 255, 0)`" 
					stroke="none" 
				/>
				<!-- <text v-for="(rect, index) in rectangles"
					:class="{ [`initial-animation-text-${rect.k}-${rect.i}`]: true, 'datapoint': true }"
					:key="'text-' + index" 
					:x="returnshowedStartPos(index).x + rect.width / 2 + spcx / 2" 
					:y="returnshowedStartPos(index).y + rect.height / 2" 
					text-anchor="middle" 
					alignment-baseline="middle" 
					fill="white" 
					font-size="12"
				>
					{{ rect.number }}
				</text> -->
				<rect v-for="(rect, index) in rectangles"
					:class="{ 'active-rect': targetRect === index || selectedIndex === index, [`initial-animation-${rect.i}-${rect.j}`]: true, 'datapoint-front': true }"
					:key="index" 
					:x="returnshowedStartPos(index).x + spcx / 2"
					:y="returnshowedStartPos(index).y" 
					:width="rect.width" 
					:height="rect.height" 
					:rx="rect.rx" 
					:ry="rect.ry" 
					@mouseenter="toggleActive(index)" 
					@mousemove="updateMouseLocation" 
					@mouseleave="toggleActiveToNull"
					@click="handleDataSelection(index)"
				/>
				<!-- <line 
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
				</text> -->
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
.rowbumpchart {
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
.ease-all {
	transition: all 0.3s ease;
	// cursor: pointer;
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