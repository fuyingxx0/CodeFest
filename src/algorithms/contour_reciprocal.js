export function interpolation(dataPoints, targetPoints) {
	// [{x:1,y:2,value:3}]
	const pointCount = dataPoints.length;
	let answers = [];
	for (let k = 0; k < targetPoints.length; k++) {
		if (dataPoints.includes(targetPoints[k])) {
			answers.push(dataPoints[dataPoints.indexOf(targetPoints[k])].value);
		} else {
			let weight_sum = 0;
			let weight_value = 0;
			for (let i = 0; i < pointCount; i++) {
				let weight =
					1 /
					((dataPoints[i].x - targetPoints[k].x) ** 2 +
						(dataPoints[i].y - targetPoints[k].y) ** 2);
				weight_sum += weight;
				weight_value += weight * dataPoints[i].value;
			}
			weight_value = weight_value / weight_sum;
			answers.push(weight_value);
		}
	}
	return answers;
}
