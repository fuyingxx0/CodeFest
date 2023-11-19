<script setup>
import { computed, ref } from "vue";
import { useMapStore } from "../../store/mapStore";

const colors = ["#dead5d", "#474747", "#5F5F5F", "#747373", "#888787"];

// register the four required props
const props = defineProps([
	"chart_config",
	"activeChart",
	"series",
	"map_config",
]);
const mapStore = useMapStore();

let max = -1;
for (let i = 0; i < 12; i++) {
	if (max < props.series[0].data[i]) max = props.series[0].data[i];
}
// console.log(max)

const R = 54;
const r = 18;
const centerx = 200;
const centery = 140;
let posCircle = [];
for (let i = 0; i < 12; i++)
	posCircle = [...posCircle, { x: centerx, y: centery }];
// console.log(posCircle)
for (let i = 0; i < 6; i++) {
	const ang1 = Math.PI / 6 + (i * Math.PI) / 3;
	posCircle[i].x += R * Math.cos(ang1);
	posCircle[i].y += R * Math.sin(ang1);
	const ang2 = (i * Math.PI) / 3;
	posCircle[i + 6].x += Math.sqrt(3) * R * Math.cos(ang2);
	posCircle[i + 6].y += Math.sqrt(3) * R * Math.sin(ang2);
}
console.log(posCircle)
const circles = Array.from({ length: 12 }, (_, index) => {
	// console.log(r * props.series[0].data[index] / max)
	return {
		cx: posCircle[index].x,
		cy: posCircle[index].y,
		r: r,
		d: `M ${posCircle[index].x} ${posCircle[index].y + r} A ${r} ${r} 0 0 1 ${posCircle[index].x} ${posCircle[index].y - r}`,
		rx: Math.abs(props.series[0].data[index] - max / 2) * 2 * r / max,
		overHalf: props.series[0].data[index] > max / 2
	};
});
const textMove = [
	{ x: 38, y: 20 },
	{ x: 0, y: 32 },
	{ x: -38, y: 20 },
	{ x: -38, y: -20 },
	{ x: 0, y: -32 },
	{ x: 38, y: -20 },
	{ x: 43, y: 0 },
	{ x: 43, y: 5 },
	{ x: -43, y: 5 },
	{ x: -43, y: 0 },
	{ x: -43, y: -5 },
	{ x: 43, y: -5 },
];

const tooltipPosition = computed(() => {
	return {
		left: `${mousePosition.value.x + 10}px`,
		top: `${mousePosition.value.y - 30}px`,
	};
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
const selectedIndex = ref(null);
function handleDataSelection(index) {
	console.log(index);
	if (!props.chart_config.map_filter) {
		return;
	}
	if (index !== selectedIndex.value) {
		mapStore.addLayerFilter(
			`${props.map_config[0].index}-${props.map_config[0].type}`,
			props.chart_config.map_filter[0],
			props.chart_config.map_filter[1][index]
		);
		selectedIndex.value = index;
	} else {
		mapStore.clearLayerFilter(
			`${props.map_config[0].index}-${props.map_config[0].type}`
		);
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
						:class="{ [`initial-animation-line-${index}`]: true }"
						:x1="circle.cx"
						:y1="circle.cy"
						:x2="centerx"
						:y2="centery"
						:stroke="colors[3]"
						stroke-width="2"
					/>
					<circle
						:class="{ [`initial-animation-circle-${index}`]: true }"
						:cx="circle.cx"
						:cy="circle.cy"
						:r="circle.r"
						:fill="colors[1]"
					/>
					<path :class="{ [`initial-animation-semicircle-${index}`]: true }" :d="circle.d" :fill="colors[0]" />
					<ellipse
						:class="{ [`initial-animation-ellipse-${index}`]: true }"
						:cx="circle.cx"
						:cy="circle.cy"
						:rx="circle.rx"
						:ry="circle.r"
						:fill="!circle.overHalf ? colors[1] : colors[0]"
					/>
					<circle
						:class="{ [`initial-animation-circle-${index}`]: true, 'circle-top': true }"
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
						:class="{ [`initial-animation-label-${index}`]: true, 'label': true }"
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
					:class="{ 'initial-animation-center-circle': true }"
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
			<div
				v-if="targetMoon !== null"
				class="moonchart-chart-info chart-tooltip"
				:style="tooltipPosition"
			>
				<h6>
					{{ props.series[0].data[targetMoon] }}
					{{ props.chart_config.unit }}
				</h6>
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

// .initial-animation-center-circle {
// 	@keyframes center-animation {
// 		0% {
// 			r: 8;
// 		}
// 		10% {
// 			r: 23;
// 		}
// 		11% {
// 			r: 22;
// 		}
// 		79% {
// 			r: 22;
// 		}
// 		80% {
// 			r: 25;
// 		}
// 		100% {
// 			r: 8;
// 		}
// 	}
// 	animation-name: center-animation;
// 	animation-duration: 4s;
// 	animation-delay: 0;
// 	animation-timing-function: ease;
// 	animation-fill-mode: forwards;
// }
// @for $i from 0 through 11 {
// 	@keyframes circle-animation-0 {
// 		0% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		44% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		50% {
// 			cx: 246.7653718043597;
// 			cy: 167;
// 			r: 18;
// 		}
// 		100% {
// 			cx: 246.7653718043597;
// 			cy: 167;
// 			r: 18;
// 		}
// 	}
// 	@keyframes circle-animation-1 {
// 		0% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		50% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		56% {
// 			cx: 200;
// 			cy: 194;
// 			r: 18;
// 		}
// 		100% {
// 			cx: 200;
// 			cy: 194;
// 			r: 18;
// 		}
// 	}
// 	@keyframes circle-animation-2 {
// 		0% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		56% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		62% {
// 			cx: 153.2346281956403;
// 			cy: 167;
// 			r: 18;
// 		}
// 		100% {
// 			cx: 153.2346281956403;
// 			cy: 167;
// 			r: 18;
// 		}
// 	}
// 	@keyframes circle-animation-3 {
// 		0% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		62% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		68% {
// 			cx: 153.2346281956403;
// 			cy: 113;
// 			r: 18;
// 		}
// 		100% {
// 			cx: 153.2346281956403;
// 			cy: 113;
// 			r: 18;
// 		}
// 	}
// 	@keyframes circle-animation-4 {
// 		0% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		68% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		74% {
// 			cx: 200;
// 			cy: 86;
// 			r: 18;
// 		}
// 		100% {
// 			cx: 200;
// 			cy: 86;
// 			r: 18;
// 		}
// 	}
// 	@keyframes circle-animation-5 {
// 		0% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		74% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		80% {
// 			cx: 246.7653718043597;
// 			cy: 113;
// 			r: 18;
// 		}
// 		100% {
// 			cx: 246.7653718043597;
// 			cy: 113;
// 			r: 18;
// 		}
// 	}
// 	@keyframes circle-animation-6 {
// 		0% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		8% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		14% {
// 			cx: 293.5307436087194;
// 			cy: 140;
// 			r: 18;
// 		}
// 		100% {
// 			cx: 293.5307436087194;
// 			cy: 140;
// 			r: 18;
// 		}
// 	}
// 	@keyframes circle-animation-7 {
// 		0% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		20% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		26% {
// 			cx: 246.7653718043597;
// 			cy: 221;
// 			r: 18;
// 		}
// 		100% {
// 			cx: 246.7653718043597;
// 			cy: 221;
// 			r: 18;
// 		}
// 	}
// 	@keyframes circle-animation-8 {
// 		0% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		26% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		32% {
// 			cx: 153.23462819564034;
// 			cy: 221;
// 			r: 18;
// 		}
// 		100% {
// 			cx: 153.23462819564034;
// 			cy: 221;
// 			r: 18;
// 		}
// 	}
// 	@keyframes circle-animation-9 {
// 		0% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		32% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		40% {
// 			cx: 106.46925639128064;
// 			cy: 140;
// 			r: 18;
// 		}
// 		100% {
// 			cx: 106.46925639128064;
// 			cy: 140;
// 			r: 18;
// 		}
// 	}
// 	@keyframes circle-animation-10 {
// 		0% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		40% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		46% {
// 			cx: 153.23462819564028;
// 			cy: 59;
// 			r: 18;
// 		}
// 		100% {
// 			cx: 153.23462819564028;
// 			cy: 59;
// 			r: 18;
// 		}
// 	}
// 	@keyframes circle-animation-11 {
// 		0% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		46% {
// 			cx: 200;
// 			cy: 140;
// 			r: 0;
// 		}
// 		52% {
// 			cx: 246.7653718043597;
// 			cy: 59;
// 			r: 18;
// 		}
// 		100% {
// 			cx: 246.7653718043597;
// 			cy: 59;
// 			r: 18;
// 		}
// 	}
// 	.initial-animation-circle-#{$i} {
// 		animation-name: circle-animation-#{$i};
// 		animation-duration: 4s;
// 		animation-delay: 0;
// 		animation-timing-function: ease;
// 		animation-fill-mode: forwards;
// 	}
// 	@keyframes easeIn {
// 		0%{
// 			opacity: 0;
// 		}
// 		80%{
// 			opacity: 0;
// 		}
// 		100%{
// 			opacity: 1;
// 		}
// 	}
// 	.initial-animation-semicircle-#{$i} {
// 		animation-name: easeIn;
// 		animation-duration: 5s;
// 		animation-delay: 0s;
// 		animation-timing-function: ease;
// 		animation-fill-mode: forwards;
// 	}
// 	.initial-animation-ellipse-#{$i} {
// 		animation-name: easeIn;
// 		animation-duration: 5s;
// 		animation-delay: 0s;
// 		animation-timing-function: ease;
// 		animation-fill-mode: forwards;
// 	}
// 	.initial-animation-line-#{$i} {
// 		animation-name: easeIn;
// 		animation-duration: 5s;
// 		animation-delay: 0s;
// 		animation-timing-function: ease;
// 		animation-fill-mode: forwards;
// 	}
// 	.initial-animation-circle-top-#{$i} {
// 		animation-name: easeIn;
// 		animation-duration: 5s;
// 		animation-delay: 0s;
// 		animation-timing-function: ease;
// 		animation-fill-mode: forwards;
// 	}
// }


</style>
