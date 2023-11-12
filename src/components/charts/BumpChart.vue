<script setup>
import { computed, ref, onMounted } from 'vue'
import { useMapStore } from '../../store/mapStore';
import '../../assets/styles/globalStyles.css';

// const colors = ['#833ab4', '#8e3978', '#ae445a', '#8b3552', '#ca695a', '#e1875a', '#f39f5a'];
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
let spcx = 20;
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
		number: sortedData[i].data[j].y
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
		stroke: colors[sortedData[i].data[j].index]
	};
});

const labels = Array.from({ length: xnum }, (_, index) => {	
	// console.log(startPos[index][0].x, sortedData[index].x);
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
	const { width, height } = textwrapper.value ? textwrapper.value.getBoundingClientRect() : { width: 0, height: 0 };
	return {
		color: colors[index],
		text: props.series[index].name,
	};
});

// const chartoutline = ref(null);
// onMounted(() => {
// 	// Access the DOM element after the component is mounted
// 	chartoutline.value = document.querySelector('.chartoutline');
// });

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
			<svg class="svg-container">
				<rect v-for="(rect, index) in rectangles"
					:key="index" 
					:x="rect.x"
					:y="rect.y" 
					:width="rect.width" 
					:height="rect.height" 
					:rx="rect.rx" 
					:ry="rect.ry" 
					:fill="rect.fill" 
					stroke="none" 
				/>
				<text v-for="(rect, index) in rectangles"
					:key="'text-' + index" 
					:x="rect.x + rect.width / 2" 
					:y="rect.y + rect.height / 2" 
					text-anchor="middle" 
					alignment-baseline="middle" 
					fill="white" 
					font-size="10"
				>
					{{ rect.number }}
				</text>
				<line v-for="(line, index) in lines"
					:key="'line-' + index"
					:x1="line.x1"
					:y1="line.y1"
					:x2="line.x2"
					:y2="line.y2"
					:stroke="line.stroke"
					stroke-width="3"
					stroke-linecap="round"
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
					:x="label.x"
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
</template>
  

<style scoped lang="scss">
.bumpchart {
    /* styles for the chart Vue component */
	display: flex;
	justify-content: center;
	align-items: center;
	overflow: auto;
}
.chartoutline {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	box-sizing: border-box;
	margin-top: 2.2vh;
	height: 100%;
	overflow: auto;
	// border: 1px solid red;
}
.textwrapper {
	width: 100%;
	height: 25px;
	display: flex;
	justify-content: center;
	gap: 14px;
	align-items: center;
	// border: 1px solid green;
}
.svg-legend {
	display: flex;
	justify-content: center;
	align-items: center;
	// border: 1px solid blue;
}
.legends {
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: small;
	gap: 8px;
	// border: 1px solid red;
}
.svg-container {
  /* Additional styles for the SVG container if needed */
	min-height: 280px;
	width: 100%;
	overflow: auto;
	// border: 1px solid blue;
}

/* Animation styles aren't required but recommended */
</style>