class Square {
	constructor(column, row) {
		this.column = column;
		this.row = row;
		this.cornerValue = null;
		this.cornerBinary = null;
		this.basicLines = [];
		this.lines = [];
		this.needVisit = null;
	}

	getCornerBinary(isoValue) {
		if (this.cornerValue === null) {
			console.log("this.cornerValue === null");
			return;
		}
		this.cornerBinary = this.cornerValue.map((val) => {
			return val > isoValue ? 1 : 0;
		});
	}

	getBasicLines(isoValue) {
		if (this.cornerBinary === null) {
			console.log("this.cornerBinary === null");
			return;
		}
		let sum = 0;
		this.cornerBinary.forEach((val, ind) => {
			sum += val * 2 ** ind;
		});
		this.basicLines = contourTable[sum];

		// Saddle points
		if (sum === 5) {
			if (this.cornerValue.reduce((a, b) => a + b) / 4 >= isoValue) {
				this.basicLines = [
					[0, 3],
					[1, 2],
				];
			} else {
				this.basicLines = [
					[0, 1],
					[2, 3],
				];
			}
		} else if (sum === 10) {
			if (this.cornerValue.reduce((a, b) => a + b) / 4 >= isoValue) {
				this.basicLines = [
					[0, 1],
					[2, 3],
				];
			} else {
				this.basicLines = [
					[0, 3],
					[1, 2],
				];
			}
		}
	}

	getActualLines(allLines, length, isoValue) {
		let interpoValues = [];
		for (let k = 0; k < 4; k++) {
			let interpolate_tmp = linearInterpolation(
				this.cornerValue[k],
				this.cornerValue[(k + 1) % 4],
				isoValue
			);
			interpoValues.push(interpolate_tmp);
		}

		interpoValues[1] = 1 - interpoValues[1];
		interpoValues[2] = 1 - interpoValues[2];

		this.basicLines.forEach((l) => {
			let newLine = [
				[
					121.4395508 +
						(this.column +
							lineEndPoints[l[0]][0] +
							(l[0] === 0 || l[0] === 2
								? interpoValues[l[0]]
								: 0.5)) *
							length,
					24.946791 +
						(this.row +
							lineEndPoints[l[0]][1] +
							(l[0] === 1 || l[0] === 3
								? interpoValues[l[0]]
								: 0.5)) *
							length,
				],
				[
					121.4395508 +
						(this.column +
							lineEndPoints[l[1]][0] +
							(l[1] === 0 || l[1] === 2
								? interpoValues[l[1]]
								: 0.5)) *
							length,
					24.946791 +
						(this.row +
							lineEndPoints[l[1]][1] +
							(l[1] === 1 || l[1] === 3
								? interpoValues[l[1]]
								: 0.5)) *
							length,
				],
			];
			allLines.push(newLine);
			this.lines.push(newLine);
		});
	}

	// setNeedVisit() {
	// 	this.needVisit = [false, false, false, false];
	// 	this.basicLines.forEach((l) => {
	// 		this.needVisit[l[0]] = true;
	// 		this.needVisit[l[1]] = true;
	// 	});
	// }

	// getActualPoint(target) {
	// 	for (let i = 0; i < this.basicLines.length; i++) {
	// 		let tmp = this.basicLines[i].findIndex((e) => e === target);
	// 		if (tmp !== -1) {
	// 			return [i, tmp];
	// 		}
	// 	}
	// 	console.log("error 1");
	// 	return null;
	// }
}

let contourTable = [
	[],
	[[0, 3]],
	[[0, 1]],
	[[1, 3]],
	[[1, 2]],
	[
		[0, 1],
		[2, 3],
	],
	[[0, 2]],
	[[2, 3]],
	[[2, 3]],
	[[0, 2]],
	[
		[0, 3],
		[1, 2],
	],
	[[1, 2]],
	[[1, 3]],
	[[0, 1]],
	[[0, 3]],
	[],
];

let lineEndPoints = [
	[0.5, 1],
	[1, 0.5],
	[0.5, 0],
	[0, 0.5],
];

let squareCorners = [
	[1, 0],
	[1, 1],
	[0, 1],
	[0, 0],
];

// class Point2 {
// 	constructor(x, y) {
// 		this.x = x;
// 		this.y = y;
// 	}

// 	add(point) {
// 		return new Point2(this.x + point.x, this.y + point.y);
// 	}

// 	multiply(m) {
// 		return new Point2(this.x * m, this.y * m);
// 	}
// }

function pointAverage(p1, p2) {
	return p1.multiply(0.5).add(p2.multiply(0.5));
}

function linearInterpolation(v1, v2, v_iso) {
	if (v2 === v1) {
		return Infinity;
	}
	return (v_iso - v1) / (v2 - v1);
}

function bezier2(p1, p2, p3, t) {
	let p12 = p1.multiply(1 - t).add(p2.multiply(t));
	let p23 = p2.multiply(1 - t).add(p3.multiply(t));
	return p12.multiply(1 - t).add(p23.multiply(t));
}

export function marchingSquare(
	squareMatrix,
	discreteData,
	allLines,
	isoValue,
	gridSize
) {
	let columnN = discreteData[0].length;
	let rowN = discreteData.length;

	for (let i = 0; i < rowN - 1; i++) {
		squareMatrix.push([]);
		for (let j = 0; j < columnN - 1; j++) {
			squareMatrix[i].push(new Square(j, i));
			squareMatrix[i][j].cornerValue = [
				discreteData[i + 1][j],
				discreteData[i + 1][j + 1],
				discreteData[i][j + 1],
				discreteData[i][j],
			];
			squareMatrix[i][j].getCornerBinary(isoValue);
			squareMatrix[i][j].getBasicLines(isoValue);
			squareMatrix[i][j].getActualLines(allLines, gridSize, isoValue);
			// squareMatrix[i][j].setNeedVisit();
		}
	}
}

// function setup() {
// 	createCanvas(1000, 600);
// 	background(100);
// 	// let l = 10;
// 	let columnN = 50;
// 	let rowN = 30;
// 	let discreteData = [];

// 	noStroke();

// 	for (let y = 0; y < rowN; y++) {
// 		discreteData.push([]);
// 		for (let x = 0; x < columnN; x++) {
// 			discreteData[y].push(noise(x / 10, y / 10 + 20));
// 			// squareMatrix[y][x].draw();

// 			noStroke();
// 			fill(noise(x / 10, y / 10 + 20) * 255);
// 			rect(
// 				(x * width) / columnN,
// 				(y * width) / columnN,
// 				width / columnN,
// 				width / columnN
// 			);

// 			stroke(20);
// 			strokeWeight(2);
// 			if (noise(x / 10, y / 10 + 20) > 0.5) {
// 				circle(
// 					((x + 0.5) * width) / columnN,
// 					((y + 0.5) * width) / columnN,
// 					2
// 				);
// 			}
// 		}
// 	}

// 	strokeWeight(1);
// 	stroke(80);
// 	noFill();
// 	for (let y = 0; y < rowN - 1; y++) {
// 		for (let x = 0; x < columnN - 1; x++) {
// 			rect(
// 				((x + 0.5) * width) / columnN,
// 				((y + 0.5) * width) / columnN,
// 				width / columnN,
// 				width / columnN
// 			);
// 		}
// 	}

// 	let squareMatrix = [];
// 	let allLines = [];
// 	let allSmoothLines = [];

// 	marchingSquare(squareMatrix, discreteData, allLines, 0.5);

// 	stroke(20);
// 	strokeWeight(2);
// 	allLines.forEach((l) => {
// 		line(l[0].x, l[0].y, l[1].x, l[1].y);
// 	});

// 	stroke(220, 0, 0);
// 	strokeWeight(1);
// }

// function draw() {}
