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
			return;
		}
		this.cornerBinary = this.cornerValue.map((val) => {
			return val > isoValue ? 1 : 0;
		});
	}

	getBasicLines(isoValue) {
		if (this.cornerBinary === null) {
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

function linearInterpolation(v1, v2, v_iso) {
	if (v2 === v1) {
		return Infinity;
	}
	return (v_iso - v1) / (v2 - v1);
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
		}
	}
}
