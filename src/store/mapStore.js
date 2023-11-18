/* mapStore */
/*
The mapStore controls the map and includes methods to modify it.

!! PLEASE BE SURE TO REFERENCE THE MAPBOX DOCUMENTATION IF ANYTHING IS UNCLEAR !!
https://docs.mapbox.com/mapbox-gl-js/guides/
*/
import { createApp, defineComponent, nextTick, ref } from "vue";
import { defineStore } from "pinia";
import { useAuthStore } from "./authStore";
import { useDialogStore } from "./dialogStore";
import mapboxGl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import { Threebox } from "threebox-plugin";

import mapStyle from "../assets/configs/mapbox/mapStyle.js";
import {
	MapObjectConfig,
	TaipeiTown,
	TaipeiVillage,
	TaipeiBuilding,
	maplayerCommonPaint,
	maplayerCommonLayout,
} from "../assets/configs/mapbox/mapConfig.js";
import { savedLocations } from "../assets/configs/mapbox/savedLocations.js";
import { calculateGradientSteps } from "../assets/configs/mapbox/arcGradient";
import MapPopup from "../components/map/MapPopup.vue";

import { voronoi } from "../algorithms/voronoi.js";
import { interpolation } from "../algorithms/contour_reciprocal.js";
import { marchingSquare } from "../algorithms/marching_square.js";

const { BASE_URL } = import.meta.env;

export const useMapStore = defineStore("map", {
	state: () => ({
		// Array of layer IDs that are in the map
		currentLayers: [],
		// Array of layer IDs that are in the map and currently visible
		currentVisibleLayers: [],
		// Stores all map configs for all layers (to be used to render popups)
		mapConfigs: {},
		// Stores the mapbox map instance
		map: null,
		// Stores popup information
		popup: null,
		// Stores saved locations
		savedLocations: savedLocations,
		// Store currently loading layers,
		loadingLayers: [],
	}),
	getters: {},
	actions: {
		/* Initialize Mapbox */
		// 1. Creates the mapbox instance and passes in initial configs
		initializeMapBox() {
			this.map = null;
			const MAPBOXTOKEN = import.meta.env.VITE_MAPBOXTOKEN;
			mapboxGl.accessToken = MAPBOXTOKEN;
			this.map = new mapboxGl.Map({
				...MapObjectConfig,
				style: mapStyle,
			});
			this.map.addControl(new mapboxGl.NavigationControl());
			this.map.doubleClickZoom.disable();
			this.map
				.on("style.load", () => {
					this.initializeBasicLayers();
				})
				.on("click", (event) => {
					if (this.popup) {
						this.popup = null;
					}
					this.addPopup(event);
				})
				.on("idle", () => {
					this.loadingLayers = this.loadingLayers.filter(
						(el) => el !== "rendering"
					);
				});
		},
		// 2. Adds three basic layers to the map (Taipei District, Taipei Village labels, and Taipei 3D Buildings)
		// Due to performance concerns, Taipei 3D Buildings won't be added in the mobile version
		initializeBasicLayers() {
			const authStore = useAuthStore();
			fetch(`${BASE_URL}/mapData/taipei_town.geojson`)
				.then((response) => response.json())
				.then((data) => {
					this.map
						.addSource("taipei_town", {
							type: "geojson",
							data: data,
						})
						.addLayer(TaipeiTown);
				});
			fetch(`${BASE_URL}/mapData/taipei_village.geojson`)
				.then((response) => response.json())
				.then((data) => {
					this.map
						.addSource("taipei_village", {
							type: "geojson",
							data: data,
						})
						.addLayer(TaipeiVillage);
				});
			if (!authStore.isMobileDevice) {
				this.map
					.addSource("taipei_building_3d_source", {
						type: "vector",
						url: import.meta.env.VITE_MAPBOXTILE,
					})
					.addLayer(TaipeiBuilding);
			}

			this.addSymbolSources();
		},
		// 3. Adds symbols that will be used by some map layers
		addSymbolSources() {
			const images = [
				"metro",
				"triangle_green",
				"triangle_white",
				"bike_green",
				"bike_orange",
				"bike_red",
			];
			images.forEach((element) => {
				this.map.loadImage(
					`${BASE_URL}/images/map/${element}.png`,
					(error, image) => {
						if (error) throw error;
						this.map.addImage(element, image);
					}
				);
			});
		},

		/* Adding Map Layers */
		// 1. Passes in the map_config (an Array of Objects) of a component and adds all layers to the map layer list
		addToMapLayerList(map_config) {
			map_config.forEach((element) => {
				let mapLayerId = `${element.index}-${element.type}`;
				// 1-1. If the layer exists, simply turn on the visibility and add it to the visible layers list
				if (
					this.currentLayers.find((element) => element === mapLayerId)
				) {
					this.loadingLayers.push("rendering");
					this.turnOnMapLayerVisibility(mapLayerId);
					if (
						!this.currentVisibleLayers.find(
							(element) => element === mapLayerId
						)
					) {
						this.currentVisibleLayers.push(mapLayerId);
					}
					return;
				}
				let appendLayerId = { ...element };
				appendLayerId.layerId = mapLayerId;
				// 1-2. If the layer doesn't exist, call an API to get the layer data
				this.loadingLayers.push(appendLayerId.layerId);
				this.fetchLocalGeoJson(appendLayerId);
			});
		},
		// 2. Call an API to get the layer data
		fetchLocalGeoJson(map_config) {
			axios
				.get(`${BASE_URL}/mapData/${map_config.index}.geojson`)
				.then((rs) => {
					this.addMapLayerSource(map_config, rs.data);
				})
				.catch((e) => console.error(e));
		},
		// 3. Add the layer data as a source in mapbox
		addMapLayerSource(map_config, data) {
			if (
				map_config.type !== "voronoi" &&
				map_config.type !== "candy" &&
				map_config.type !== "isoline"
			) {
				this.map.addSource(`${map_config.layerId}-source`, {
					type: "geojson",
					data: { ...data },
				});
			}

			if (map_config.type === "arc") {
				this.AddArcMapLayer(map_config, data);
			} else if (map_config.type === "voronoi") {
				this.AddVoronoiMapLayer(map_config, data);
			} else if (map_config.type === "candy") {
				this.AddCandyMapLayer(map_config, data);
			} else if (map_config.type === "isoline") {
				this.AddIsolineMapLayer(map_config, data);
			} else if (map_config.type === "contour") {
				//
			} else {
				this.addMapLayer(map_config);
			}
		},
		// 4-1. Using the mapbox source and map config, create a new layer
		// The styles and configs can be edited in /assets/configs/mapbox/mapConfig.js
		addMapLayer(map_config) {
			let extra_paint_configs = {};
			let extra_layout_configs = {};
			if (map_config.icon) {
				extra_paint_configs = {
					...maplayerCommonPaint[
						`${map_config.type}-${map_config.icon}`
					],
				};
				extra_layout_configs = {
					...maplayerCommonLayout[
						`${map_config.type}-${map_config.icon}`
					],
				};
			}
			if (map_config.size) {
				extra_paint_configs = {
					...extra_paint_configs,
					...maplayerCommonPaint[
						`${map_config.type}-${map_config.size}`
					],
				};
				extra_layout_configs = {
					...extra_layout_configs,
					...maplayerCommonLayout[
						`${map_config.type}-${map_config.size}`
					],
				};
			}
			this.loadingLayers.push("rendering");
			this.map.addLayer({
				id: map_config.layerId,
				type: map_config.type,
				paint: {
					...maplayerCommonPaint[`${map_config.type}`],
					...extra_paint_configs,
					...map_config.paint,
				},
				layout: {
					...maplayerCommonLayout[`${map_config.type}`],
					...extra_layout_configs,
				},
				source: `${map_config.layerId}-source`,
			});
			this.currentLayers.push(map_config.layerId);
			this.mapConfigs[map_config.layerId] = map_config;
			this.currentVisibleLayers.push(map_config.layerId);
			this.loadingLayers = this.loadingLayers.filter(
				(el) => el !== map_config.layerId
			);
		},
		// 4-2. Add Map Layer for Arc Maps
		AddArcMapLayer(map_config, data) {
			const authStore = useAuthStore();
			const lines = [...JSON.parse(JSON.stringify(data.features))];
			const arcInterval = 20;

			this.loadingLayers.push("rendering");

			for (let i = 0; i < lines.length; i++) {
				let line = [];
				let lngDif =
					lines[i].geometry.coordinates[1][0] -
					lines[i].geometry.coordinates[0][0];
				let lngInterval = lngDif / arcInterval;
				let latDif =
					lines[i].geometry.coordinates[1][1] -
					lines[i].geometry.coordinates[0][1];
				let latInterval = latDif / arcInterval;

				let maxElevation =
					Math.pow(Math.abs(lngDif * latDif), 0.5) * 80000;

				for (let j = 0; j < arcInterval + 1; j++) {
					let waypointElevation =
						Math.sin((Math.PI * j) / arcInterval) * maxElevation;
					line.push([
						lines[i].geometry.coordinates[0][0] + lngInterval * j,
						lines[i].geometry.coordinates[0][1] + latInterval * j,
						waypointElevation,
					]);
				}

				lines[i].geometry.coordinates = [...line];
			}

			const tb = (window.tb = new Threebox(
				this.map,
				this.map.getCanvas().getContext("webgl"), //get the context from the map canvas
				{ defaultLights: true }
			));

			const delay = authStore.isMobileDevice ? 2000 : 500;

			setTimeout(() => {
				this.map.addLayer({
					id: map_config.layerId,
					type: "custom",
					renderingMode: "3d",
					onAdd: function () {
						const paintSettings = map_config.paint
							? map_config.paint
							: { "arc-color": ["#ffffff"] };
						const gradientSteps = calculateGradientSteps(
							paintSettings["arc-color"][0],
							paintSettings["arc-color"][1]
								? paintSettings["arc-color"][1]
								: paintSettings["arc-color"][0],
							arcInterval + 1
						);
						for (let line of lines) {
							let lineOptions = {
								geometry: line.geometry.coordinates,
								color: 0xffffff,
								width: paintSettings["arc-width"]
									? paintSettings["arc-width"]
									: 2,
								opacity:
									paintSettings["arc-opacity"] ||
									paintSettings["arc-opacity"] === 0
										? paintSettings["arc-opacity"]
										: 0.5,
							};

							let lineMesh = tb.line(lineOptions);
							lineMesh.geometry.setColors(gradientSteps);
							lineMesh.material.vertexColors = true;

							tb.add(lineMesh);
						}
					},
					render: function () {
						tb.update(); //update Threebox scene
					},
				});
				this.currentLayers.push(map_config.layerId);
				this.mapConfigs[map_config.layerId] = map_config;
				this.currentVisibleLayers.push(map_config.layerId);
				this.loadingLayers = this.loadingLayers.filter(
					(el) => el !== map_config.layerId
				);
			}, delay);
		},

		AddVoronoiMapLayer(map_config, data) {
			// Feed data into Voronoi algorithm
			let seenKeys = [];

			let voronoi_source = {
				type: data.type,
				crs: data.crs,
				features: [],
			};

			let pointSize = 0.0001;
			let numOfSides = 10;
			let angles = [...Array(numOfSides + 1).keys()].map((i) => {
				return [
					pointSize * Math.cos(2 * Math.PI * (i / numOfSides)),
					pointSize * Math.sin(2 * Math.PI * (i / numOfSides)),
				];
			});

			// iterate through all data
			data.features.forEach((location) => {
				let key = location.properties[map_config.filter_key];

				// found new category
				if (!seenKeys.includes(key)) {
					seenKeys.push(key);

					// get all the data within the category
					let cat1 = data.features.filter((item) => {
						return item.properties[map_config.filter_key] === key;
					});

					// // push to source data (points)
					// for (let i = 0; i < cat1.length; i++) {
					// 	voronoi_source.features.push({
					// 		type: cat1[i].type,
					// 		properties: cat1[i].properties,
					// 		geometry: {
					// 			type: "LineString",
					// 			coordinates: angles.map((angle) => {
					// 				return [
					// 					cat1[i].geometry.coordinates[0] +
					// 						angle[0],
					// 					cat1[i].geometry.coordinates[1] +
					// 						angle[1],
					// 				];
					// 			}),
					// 		},
					// 	});
					// }

					// remove duplicate coordinates (so that it wont't cause problems in the Voronoi algorithm...)
					cat1 = cat1.filter((val, ind) => {
						return (
							cat1.findIndex((item) => {
								return (
									item.geometry.coordinates[0] ===
										val.geometry.coordinates[0] &&
									item.geometry.coordinates[1] ===
										val.geometry.coordinates[1]
								);
							}) === ind
						);
					});

					// get coordnates alone
					let cat2 = cat1.map((item) => {
						return item.geometry.coordinates;
					});

					// calculate cell for each coordinate
					let cells = voronoi(cat2);

					// push to source data (cells)
					for (let i = 0; i < cells.length; i++) {
						voronoi_source.features.push({
							type: cat1[i].type,
							properties: cat1[i].properties,
							geometry: {
								type: "LineString",
								coordinates: cells[i],
							},
						});
					}
				}
			});

			this.map.addSource(`${map_config.layerId}-source`, {
				type: "geojson",
				data: { ...voronoi_source },
			});

			let new_map_config = { ...map_config };
			new_map_config.type = "line";
			this.addMapLayer(new_map_config);
		},

		AddCandyMapLayer(map_config, data) {
			let dotR = 0.0002;
			let dotArrangements = [
				[[0, 0]],
				[
					[-dotR, 0],
					[dotR, 0],
				],
				[
					[0, -1.1547 * dotR],
					[-dotR, 0.5774 * dotR],
					[dotR, 0.5774 * dotR],
				],
				[
					[-dotR, -dotR],
					[dotR, -dotR],
					[-dotR, dotR],
					[dotR, dotR],
				],
				[
					[0, -1.7013 * dotR],
					[1.618 * dotR, -0.5257 * dotR],
					[dotR, 1.3764 * dotR],
					[-dotR, 1.3764 * dotR],
					[-1.618 * dotR, -0.5257 * dotR],
				],
				[
					[0, -2 * dotR],
					[1.732 * dotR, -dotR],
					[1.732 * dotR, dotR],
					[0, 2 * dotR],
					[-1.732 * dotR, dotR],
					[-1.732 * dotR, -dotR],
				],
				[
					[0, -2 * dotR],
					[1.732 * dotR, -dotR],
					[1.732 * dotR, dotR],
					[0, 2 * dotR],
					[-1.732 * dotR, dotR],
					[-1.732 * dotR, -dotR],
					[0, 0],
				],
			];

			let new_data = {
				type: data.type,
				crs: { ...data.crs },
				features: [],
			};

			data.features.forEach((item) => {
				let num_of_services = item.properties.services.length;

				for (let i = 0; i < Math.min(num_of_services, 7); i++) {
					new_data.features.push({
						...item,
						properties: {
							...item.properties,
							service: item.properties.services[i],
						},
						geometry: {
							...item.geometry,
							coordinates: [
								item.geometry.coordinates[0] +
									dotArrangements[num_of_services - 1][i][0],
								item.geometry.coordinates[1] +
									dotArrangements[num_of_services - 1][i][1],
							],
						},
					});
				}

				new_data.features.push({
					...item,
					properties: {
						...item.properties,
						service: "center_point",
					},
					geometry: {
						...item.geometry,
						coordinates: [
							item.geometry.coordinates[0],
							item.geometry.coordinates[1],
						],
					},
				});
			});

			this.map.addSource(`${map_config.layerId}-source`, {
				type: "geojson",

				data: { ...new_data },
			});

			let new_map_config = map_config;
			new_map_config.type = "circle";

			let paint = ["interpolate", ["linear"], ["zoom"]];
			for (let zoomLv = 11; zoomLv <= 20; zoomLv++) {
				paint.push(zoomLv);
				paint.push([
					"match",
					["get", "service"],
					"center_point",
					zoomLv > 13 ? 0 : 5,
					2 ** (zoomLv - 11.5),
				]);
			}

			new_map_config.paint = {
				"circle-color": map_config.paint["service-color"],
				"circle-radius": paint,
				"circle-opacity": 1,
			};

			this.addMapLayer(new_map_config);
		},

		AddIsolineMapLayer(map_config, data) {
			console.log("hi");
			let dataPoints = data.features.map((item) => {
				return {
					x: item.geometry.coordinates[0],
					y: item.geometry.coordinates[1],
					value: item.properties.value,
				};
			});

			let targetPoints = [];
			let gridSize = 0.001;

			let rowN = 0;
			let columnN = 0;
			for (
				let i = 121.4395508;
				i <= 121.6735101;
				i += gridSize, rowN += 1
			) {
				columnN = 0;
				for (
					let j = 24.946791;
					j <= 25.2181139;
					j += gridSize, columnN += 1
				) {
					targetPoints.push({ x: i, y: j });
				}
			}

			let interpolationResult = interpolation(dataPoints, targetPoints);

			console.log(interpolationResult.length);

			discreteData = [];
			for (let y = 0; y < rowN; y++) {
				discreteData.push([]);
				for (let x = 0; x < columnN; x++) {
					// discreteData[y].push(noise(x / 10, y / 10 + 20));
					discreteData[y].push(interpolationResult[y * columnN + x]);
				}
			}

			let squareMatrix = [];
			let allLines = [];

			marchingSquare(squareMatrix, discreteData, allLines, 100, gridSize);

			console.log(squareMatrix.length);
			console.log(squareMatrix[0].length);
		},

		//  5. Turn on the visibility for a exisiting map layer
		turnOnMapLayerVisibility(mapLayerId) {
			this.map.setLayoutProperty(mapLayerId, "visibility", "visible");
		},
		// 6. Turn off the visibility of an exisiting map layer but don't remove it completely
		turnOffMapLayerVisibility(map_config) {
			map_config.forEach((element) => {
				let mapLayerId = `${element.index}-${element.type}`;
				this.loadingLayers = this.loadingLayers.filter(
					(el) => el !== mapLayerId
				);

				if (this.map.getLayer(mapLayerId)) {
					this.map.setFilter(mapLayerId, null);
					this.map.setLayoutProperty(
						mapLayerId,
						"visibility",
						"none"
					);
				}
				this.currentVisibleLayers = this.currentVisibleLayers.filter(
					(element) => element !== mapLayerId
				);
			});
			this.removePopup();
		},

		/* Popup Related Functions */
		// Adds a popup when the user clicks on a item. The event will be passed in.
		addPopup(event) {
			// Gets the info that is contained in the coordinates that the user clicked on (only visible layers)
			const clickFeatureDatas = this.map.queryRenderedFeatures(
				event.point,
				{
					layers: this.currentVisibleLayers,
				}
			);
			// Return if there is no info in the click
			if (!clickFeatureDatas || clickFeatureDatas.length === 0) {
				return;
			}
			// Parse clickFeatureDatas to get the first 3 unique layer datas, skip over already included layers
			const mapConfigs = [];
			const parsedPopupContent = [];
			let previousParsedLayer = "";

			for (let i = 0; i < clickFeatureDatas.length; i++) {
				if (mapConfigs.length === 3) break;
				if (previousParsedLayer === clickFeatureDatas[i].layer.id)
					continue;
				previousParsedLayer = clickFeatureDatas[i].layer.id;
				mapConfigs.push(this.mapConfigs[clickFeatureDatas[i].layer.id]);
				parsedPopupContent.push(clickFeatureDatas[i]);
			}
			// Create a new mapbox popup
			this.popup = new mapboxGl.Popup()
				.setLngLat(event.lngLat)
				.setHTML('<div id="vue-popup-content"></div>')
				.addTo(this.map);
			// Mount a vue component (MapPopup) to the id "vue-popup-content" and pass in data
			const PopupComponent = defineComponent({
				extends: MapPopup,
				setup() {
					// Only show the data of the topmost layer
					return {
						popupContent: parsedPopupContent,
						mapConfigs: mapConfigs,
						activeTab: ref(0),
					};
				},
			});
			// This helps vue determine the most optimal time to mount the component
			nextTick(() => {
				const app = createApp(PopupComponent);
				app.mount("#vue-popup-content");
			});
		},
		// Remove the current popup
		removePopup() {
			if (this.popup) {
				this.popup.remove();
			}
			this.popup = null;
		},

		/* Functions that change the viewing experience of the map */

		// Add new saved location that users can quickly zoom to
		addNewSavedLocation(name) {
			const coordinates = this.map.getCenter();
			const zoom = this.map.getZoom();
			const pitch = this.map.getPitch();
			const bearing = this.map.getBearing();
			this.savedLocations.push([coordinates, zoom, pitch, bearing, name]);
		},
		// Zoom to a location
		// [[lng, lat], zoom, pitch, bearing, savedLocationName]
		easeToLocation(location_array) {
			this.map.easeTo({
				center: location_array[0],
				zoom: location_array[1],
				duration: 4000,
				pitch: location_array[2],
				bearing: location_array[3],
			});
		},
		// Remove a saved location
		removeSavedLocation(index) {
			this.savedLocations.splice(index, 1);
		},
		// Force map to resize after sidebar collapses
		resizeMap() {
			if (this.map) {
				setTimeout(() => {
					this.map.resize();
				}, 200);
			}
		},

		/* Map Filtering */
		// Add a filter based on a property on a map layer
		addLayerFilter(layer_id, property, key, map_config) {
			const dialogStore = useDialogStore();
			if (!this.map || dialogStore.dialogs.moreInfo) {
				return;
			}
			if (map_config && map_config.type === "arc") {
				this.map.removeLayer(layer_id);
				let toBeFiltered = {
					...this.map.getSource(`${layer_id}-source`)._data,
				};
				toBeFiltered.features = toBeFiltered.features.filter(
					(el) => el.properties[property] === key
				);
				map_config.layerId = layer_id;
				this.AddArcMapLayer(map_config, toBeFiltered);
				return;
			}
			this.map.setFilter(layer_id, ["==", ["get", property], key]);
		},
		// Remove any filters on a map layer
		clearLayerFilter(layer_id, map_config) {
			const dialogStore = useDialogStore();
			if (!this.map || dialogStore.dialogs.moreInfo) {
				return;
			}
			if (map_config && map_config.type === "arc") {
				this.map.removeLayer(layer_id);
				let toRestore = {
					...this.map.getSource(`${layer_id}-source`)._data,
				};
				map_config.layerId = layer_id;
				this.AddArcMapLayer(map_config, toRestore);
				return;
			}
			this.map.setFilter(layer_id, null);
		},

		/* Clearing the map */

		// Called when the user is switching between maps
		clearOnlyLayers() {
			this.currentLayers.forEach((element) => {
				this.map.removeLayer(element);
				this.map.removeSource(`${element}-source`);
			});
			this.currentLayers = [];
			this.mapConfigs = {};
			this.currentVisibleLayers = [];
			this.removePopup();
		},
		// Called when user navigates away from the map
		clearEntireMap() {
			this.currentLayers = [];
			this.mapConfigs = {};
			this.map = null;
			this.currentVisibleLayers = [];
			this.removePopup();
		},
	},
});
