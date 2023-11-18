function interpolation(dataPoints, targetPoints) {
	const pointCount = dataPoints.length;
	var answers = [];
	for (var k = 0; k < targetPoints.length; k++) {
		if (dataPoints.includes(targetPoints[k])) {
			answers.push(dataPoints[dataPoints.indexOf(targetPoints[k]).value]);
		} else {
			var weight_list = [];
			var weight_sum = 0;
			var weight_value = 0;
			for (var i = 0; i < pointCount; i++) {
				var weight =
					1 /
					((dataPoints[i].x - targetPoints[k].x) ** 2 +
						(dataPoints[i].y - targetPoints[k].y) ** 2);
				weight_list.push(weight);
				weight_sum += weight;
				weight_value += weight * dataPoints[i].value;
			}
			weight_value = weight_value / weight_sum;
			answers.push(weight_value);
		}
	}
	return answers;
}
