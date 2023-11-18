function matrixMultiply(A, B) {
	var rowsA = A.length;
	var colsA = A[0].length;
	var colsB = B[0].length;
	let result = Array(colsB).fill(Array(rowsA).fill(0));
	for (let i = 0; i < rowsA; i++) {
		for (let j = 0; j < colsB; j++) {
			for (let k = 0; k < colsA; k++) {
				result[j][i] += A[i][k] * B[k][j];
			}
		}
	}
	return result;
}

function matrixInverse(matrix) {
	// 建立單位矩陣
	function createIdentityMatrix(n) {
		const identityMatrix = [];
		for (let i = 0; i < n; i++) {
			const row = [];
			for (let j = 0; j < n; j++) {
				row.push(i === j ? 1 : 0);
			}
			identityMatrix.push(row);
		}
		return identityMatrix;
	}

	// 將兩個矩陣合併
	function augmentMatrix(matrix1, matrix2) {
		const augmentedMatrix = [];
		for (let i = 0; i < matrix1.length; i++) {
			augmentedMatrix.push(matrix1[i].concat(matrix2[i]));
		}
		return augmentedMatrix;
	}
	// 檢查矩陣是否為方陣
	if (matrix.length !== matrix[0].length) {
		throw new Error("矩陣不是方陣，無法計算逆矩陣");
	}
	const n = matrix.length;
	const identityMatrix = createIdentityMatrix(n);
	const augmentedMatrix = augmentMatrix(matrix, identityMatrix);
	// 高斯-約旦消元法
	for (let i = 0; i < n; i++) {
		// 將主對角線元素變為1
		const scale = 1 / augmentedMatrix[i][i];
		for (let j = 0; j < 2 * n; j++) {
			augmentedMatrix[i][j] *= scale;
		}
		// 將其他列的該列元素變為0
		for (let k = 0; k < n; k++) {
			if (k !== i) {
				const factor = augmentedMatrix[k][i];
				for (let j = 0; j < 2 * n; j++) {
					augmentedMatrix[k][j] -= factor * augmentedMatrix[i][j];
				}
			}
		}
	}
	// 提取逆矩陣部分
	const inverse = [];
	for (let i = 0; i < n; i++) {
		inverse.push(augmentedMatrix[i].slice(n));
	}
	return inverse;
}

function krige(points, unknownPoint) {
	const nugget = 0.1; // 均勻性
	const sill = 0.5; // 變異數
	const range = 10; // 空間相依性範圍

	const n = points.length;

	const semivariance = (h) =>
		nugget + sill * (1 - Math.exp(-(h ** 2 / range)));

	let A = Array(n + 1).fill(Array(n + 1).fill(0));
	console.log(A);
	let B = Array(n + 1).fill(1);
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			A[i][j] = semivariance(
				Math.sqrt(
					(points[i].x - points[j].x) ** 2 +
						(points[i].y - points[j].y) ** 2
				)
			);
		}
		A[i][n] = 1;
		A[n][i] = 1;
		B[i] = semivariance(
			Math.sqrt(
				(points[i].x - unknownPoint.x) ** 2 +
					(points[i].y - unknownPoint.y) ** 2
			)
		);
	}
	console.log(A);
	A[n][n] = 0;
	// const C = matrixMultiply(matrixInverse(A), B);
	console.log(A);

	// let interpolatedValue = 0;
	// for(let i = 0; i < n; i++){
	// 	interpolatedValue = C[i] * points[i].value;
	// }

	// return interpolatedValue;
}

const knownPoints = [
	{ x: 0, y: 0, value: 1 },
	{ x: 1, y: 0, value: 1 },
	{ x: 0, y: 1, value: 1 },
	{ x: 1, y: 1, value: 1 },
];
const unknownPoint = { x: 1, y: 1 };

krige(knownPoints, unknownPoint);
// const result = krige(knownPoints, unknownPoint);
// console.log(result);

// export function contour(data) {

// }
