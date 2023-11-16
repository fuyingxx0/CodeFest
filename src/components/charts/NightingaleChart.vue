<script setup>
import { computed, ref } from 'vue'
import { useMapStore } from '../../store/mapStore';

const colors = ['#ae445a', '#ca695a', '#f39f5a', '#8e3978', '#8b3552', '#e1875a'];
const colorBG = '#282A2C';

// register the four required props
const props = defineProps(['chart_config', 'activeChart', 'series', 'map_config'])
const mapStore = useMapStore()

// data
let data = [];
let dataMax = -1;
for(let j = 0; j < props.series[0].data.length; j++){
	data = [...data, {
		'a': props.chart_config['categories'][j],
		'data': []
	}]
	for(let i = 0; i < props.series.length; i++){
		// i: a, j: r
		data[j].data = [...data[j].data, {
			'r': props.series[i].name,
			'value': props.series[i].data[j]
		}];
		if(dataMax < props.series[i].data[j]) dataMax = props.series[i].data[j];
	}
	data[j].data.sort((a, b) => b.value - a.value);
}
// console.log(data);

const anumTotal = data.length;
const rnumTotal = data[0].data.length
const anum = ref(data.length);
const rnum = ref(data[0].data.length);
const showedData = ref(data);
const showedMax = ref(dataMax);
const rShow = ref(Array(data[0].data.length).fill(true));
const aHovered = ref(-1);

const mousePosition = ref({ x: null, y: null });
function toggleActive(i) {
	// console.log('toggleActive called, ', i);
	aHovered.value = i % anum.value;
}
function toggleActiveToNull() {
	// console.log('toggleActiveToNull called, ');
	aHovered.value = -1;
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

function handleLegendSelection(index){
	rShow.value[index] = !rShow.value[index];
	let newData = [];
	let newMax = -1;
	for(let a = 0; a < anumTotal; a++){
		newData = [...newData, {
			'a': data[a].a,
			'data': []
		}]
		for(let r = 0; r < data[a].data.length; r++){
			if(rShow.value[r]){
				newData[a]['data'] = [...newData[a]['data'], {
					'r': r,
					'value': data[a].data[r].value
				}]
				if(newMax < data[a].data[r].value) newMax = data[a].data[r].value;
			}
			else {
				newData[a]['data'] = [...newData[a]['data'], {
					'r': r,
					'value': 0
				}]
			}		
		}
	}
	showedMax.value = newMax;
	showedData.value = newData;
}

const aspc = 8 * Math.PI * 2 / 180;
const rmin = 70;
const cr = 30;
const rmax = 70;
const rselected = 90;
const cx = 180;
const cy = 130;
// max: showedMax.value, return {radius, startAngle, endAngle}
function calcSector(a, r) {
	let awid = (Math.PI * 2 / anum.value - aspc) * (rnum.value / (rnum.value + 1));
	// let astart = a * Math.PI * 2 / anum.value + aspc / 2 + r / (rnum.value + 1);
	let astart = a * Math.PI * 2 / anum.value + aspc / 2 + r * .1;
	let aend = astart + awid;
	let rend = aHovered.value === a ? ((showedData.value[a].data[r].value / showedData.value[a].data[0].value) * rselected + rmin) : ((showedData.value[a].data[r].value / showedMax.value) * rmax + rmin);
	return ({
		'radius': rShow.value[r] === true ? rend : 0,
		'startAngle': astart,
		'endAngle': aend
	})
}
function getSectorPath(cx, cy, radius, startAngle, endAngle){
	const x1 = cx + radius * Math.sin(startAngle);
	const y1 = cy - radius * Math.cos(startAngle);
	const x2 = cx + radius * Math.sin(endAngle);
	const y2 = cy - radius * Math.cos(endAngle);
	const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';
	return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

const sectors = Array.from({ length: anumTotal * rnumTotal }, (_, index) => {
	const a = index % anum.value;
	const r = (index / anum.value) | 0;
	return {
		show: true,
		r: r,
		a: a,
		fill: colors[r],
		stroke: colorBG,
		stroke_width: 2
	};
});

function sectorD(index) {
	const a = index % anum.value;
	const r = (index / anum.value) | 0;
	const posFac = calcSector(a, r);
	return getSectorPath(cx, cy, posFac.radius, posFac.startAngle, posFac.endAngle);
}

const legends = Array.from({ length: rnum.value }, (_, index) => {
	// const { width, height } = textwrapper.value ? textwrapper.value.getBoundingClientRect() : { width: 0, height: 0 };
	return {
		color: colors[index],
		text: props.series[index].name,
	};
});

</script>

<template>
    <!-- conditionally render the chart -->
    <div v-if="activeChart === 'NightingaleChart'" class="nigntingalechart">
        <!-- The layout of the chart Vue component -->
        <!-- Utilize the @click event listener to enable map filtering by data selection -->
		<div class="textwrapper">
			<div class="legends" v-for="(legend, index) in legends"
				:key="index" 
				@click="handleLegendSelection(index)"
			>
				<svg class="svg-legend" style="width: 15px; height: 15px;">
					<rect width="15" height="15" :fill="legend.color" rx="4" ry="4"/>
				</svg>
				<span> {{ legend.text }} </span>
			</div>
		</div>
		<svg class="svg-container" xmlns="http://www.w3.org/2000/svg">
			<g v-for="(sector, index) in sectors" :key="index">
				<path
					:class="{ [`initial-animation-sector-${sector.a}-${sector.r}`]: true, 'sector': true }"
					v-if="sector.show"
					:d="sectorD(index)"
					:fill="sector.fill"
					:stroke="sector.stroke"
					:stroke-width="sector.stroke_width"
					@mouseenter="toggleActive(index)" 
					@mousemove="updateMouseLocation" 
					@mouseleave="toggleActiveToNull"
					@click="handleDataSelection(index)"
				/>
			</g>
			<circle
				:cx="cx"
				:cy="cy"
				:r="cr"
				:stroke="null"
				:fill="colorBG"
			/>
		</svg>
    </div>
</template>

<style scoped lang="scss">
.nigntingalechart {
    /* styles for the chart Vue component */
	overflow: scroll;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	// border: 1px solid blue;
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
.svg-container {
	min-height: 320px;
	width: 360px;
	overflow: scroll;
	// border: 1px solid red;
}
.sector {
  transition: all 0.3s ease;
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
@for $a from 0 through 100 {
	@for $r from 0 through 100 {
		.initial-animation-sector-#{$a}-#{$r} {
			animation-name: ease-in;
			animation-duration: 0.25s;
			animation-delay: 0.01s * ($a * 5 + $r);
			animation-timing-function: linear;
			animation-fill-mode: forwards;
			opacity: 0;
		}
	}
}
/* Animation styles aren't required but recommended */
</style>