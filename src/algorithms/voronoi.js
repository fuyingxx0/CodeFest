let pointID = 0;

function findCenter(p1, p2, p3) {
	let d =
		(p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) *
		2;

	// how to deal with the case that d === 0? (points having same coordinates, falling on the same line...)

	let x =
		((p1.x ** 2 + p1.y ** 2) * (p2.y - p3.y) +
			(p2.x ** 2 + p2.y ** 2) * (p3.y - p1.y) +
			(p3.x ** 2 + p3.y ** 2) * (p1.y - p2.y)) /
		d;
	let y =
		((p1.x ** 2 + p1.y ** 2) * (p3.x - p2.x) +
			(p2.x ** 2 + p2.y ** 2) * (p1.x - p3.x) +
			(p3.x ** 2 + p3.y ** 2) * (p2.x - p1.x)) /
		d;

	let p = new Point(x, y);
	return p;
}

function compareEdges(e1, e2) {
	// 0: e1 > e2
	// 1: e1 = e2
	// 2: e1 < e2
	// compare p1 (the point with smaller id) first
	// this function is used to decide the position of an edge in the BST

	if (e1.p1.id > e2.p1.id) {
		return 0;
	}
	if (e1.p1.id < e2.p1.id) {
		return 2;
	}
	if (e1.p2.id > e2.p2.id) {
		return 0;
	}
	if (e1.p2.id < e2.p2.id) {
		return 2;
	}
	return 1;
}

class BT_Node {
	constructor(val) {
		this.val = val;
		this.left = null;
		this.right = null;
	}
}

class BinarySearchTree {
	constructor() {
		this.root = null;
	}

	insert(val) {
		const newNode = new BT_Node(val);
		if (!this.root) {
			this.root = newNode;
			return this;
		}
		let currentNode = this.root;
		while (currentNode) {
			if (compareEdges(val, currentNode.val) === 1) return undefined;
			if (compareEdges(val, currentNode.val) === 0) {
				if (!currentNode.right) {
					currentNode.right = newNode;
					return this;
				}
				currentNode = currentNode.right;
			} else {
				// compareEdges(val, currentNode.val) === 2
				if (!currentNode.left) {
					currentNode.left = newNode;
					return this;
				}
				currentNode = currentNode.left;
			}
		}
	}

	find(val) {
		if (!this.root) return false;
		let currentNode = this.root;
		while (currentNode) {
			if (compareEdges(val, currentNode.val) === 2) {
				currentNode = currentNode.left;
			} else if (compareEdges(val, currentNode.val) === 0) {
				currentNode = currentNode.right;
			} else {
				return currentNode;
			}
		}
		return false;
	}

	remove(val) {
		if (val === null || val === undefined) return undefined;
		this.root = this.removeHelper(val, this.root);
	}

	removeHelper(val, currentNode) {
		if (!currentNode) return undefined;
		if (compareEdges(val, currentNode.val) === 2) {
			currentNode.left = this.removeHelper(val, currentNode.left);
			return currentNode;
		} else if (compareEdges(val, currentNode.val) === 0) {
			currentNode.right = this.removeHelper(val, currentNode.right);
			return currentNode;
		}
		if (!currentNode.left && !currentNode.right) {
			return null;
		} else if (!currentNode.left) {
			return currentNode.right;
		} else if (!currentNode.right) {
			return currentNode.left;
		} else {
			let minRightChildNode = this.findMinValue(currentNode.right);
			currentNode.val = minRightChildNode.val;
			currentNode.right = this.removeHelper(
				minRightChildNode.val,
				currentNode.right
			);
			return currentNode;
		}
	}

	findMinValue(node) {
		if (node.left) {
			return this.findMinValue(node.left);
		}
		return node;
	}
}

class EdgeManager {
	constructor() {
		this.tree = new BinarySearchTree();
	}

	assignEdge(p1, p2, triangle) {
		let newEdge = new Edge(p1, p2);
		let node = this.tree.find(newEdge);

		if (node === false) {
			// the edge is not yet in the BST
			newEdge.t1 = triangle;
			newEdge.p1.lastLineConnected = newEdge;
			newEdge.p2.lastLineConnected = newEdge;
			this.tree.insert(newEdge);
			return newEdge;
		} else {
			// the edge is already in the BST
			if (node.val.t1 === null) {
				node.val.t1 = triangle;
			} else if (node.val.t2 === null) {
				node.val.t2 = triangle;
			}
			// else {
			// 	console.log("Both t1 and t2 are already assigned?");
			// 	console.log(node.val);
			// }
			return node.val;
		}
	}

	removeTriangle(triangle) {
		for (let i = 0; i < 3; i++) {
			let node = this.tree.find(triangle.edges[i]);
			if (node !== false) {
				if (node.val.t1 === triangle) {
					node.val.t1 = null;
				}
				if (node.val.t2 === triangle) {
					node.val.t2 = null;
				}
			}
		}
	}
}

let edgeManager = new EdgeManager();

class Triangle {
	constructor(p1, p2, p3) {
		this.points = [p1, p2, p3];
		this.edges = [
			edgeManager.assignEdge(p1, p2, this),
			edgeManager.assignEdge(p2, p3, this),
			edgeManager.assignEdge(p3, p1, this),
		];
		this.center = findCenter(p1, p2, p3); // center of the circumcircle
		this.radius2 = this.center.distance2(p1); // radius of the circumcircle
	}

	circumcircleContains(p) {
		return this.center.distance2(p) < this.radius2;
	}
}

class Edge {
	constructor(p1, p2) {
		if (p1.id <= p2.id) {
			this.p1 = p1;
			this.p2 = p2;
		} else {
			this.p1 = p2;
			this.p2 = p1;
		}
		this.t1 = null;
		this.t2 = null;

		this.crossed = false;
	}
}

class Point {
	constructor(x, y) {
		this.id = pointID;
		this.x = x;
		this.y = y;
		this.lastLineConnected = null;
		pointID += 1;
	}

	equals(p) {
		return this.id === p.id;
	}

	distance2(p) {
		return (this.x - p.x) ** 2 + (this.y - p.y) ** 2;
	}

	toArray() {
		return [this.x, this.y];
	}
}

function BowyerWatson(points) {
	// covers all of Taipei
	let cornerPoints = [
		new Point(121.1, 25.272604303072),
		new Point(122, 25.272604303072),
		new Point(122, 24.939016012761282),
		new Point(121.1, 24.939016012761282),
	];
	let superTriangle1 = new Triangle(
		cornerPoints[0],
		cornerPoints[1],
		cornerPoints[2]
	);
	let superTriangle2 = new Triangle(
		cornerPoints[0],
		cornerPoints[3],
		cornerPoints[2]
	);

	let triangulation = [superTriangle1, superTriangle2];

	points.forEach((p) => {
		// empty edge list
		let affectedEdges = [];

		triangulation = triangulation.filter((t) => {
			if (t.circumcircleContains(p)) {
				edgeManager.removeTriangle(t);
				affectedEdges = affectedEdges.concat(t.edges);
				return false;
			}
			return true;
		});

		let uniqueEdges = [];

		for (var i = 0; i < affectedEdges.length; ++i) {
			var isUnique = true;

			// See if edge is unique
			for (var j = 0; j < affectedEdges.length; ++j) {
				if (i != j && affectedEdges[i] === affectedEdges[j]) {
					isUnique = false;
					edgeManager.tree.remove(affectedEdges[i]);
					break;
				}
			}

			if (isUnique) {
				uniqueEdges.push(affectedEdges[i]);
			}
		}

		uniqueEdges.forEach((e) => {
			triangulation.push(new Triangle(e.p1, e.p2, p));
		});
	});
}

// function voronoiDFS(triangle) {
// 	for (let i = 0; i < 3; i++) {
// 		let neighbor =
// 			triangle.edges[i].t1 === triangle
// 				? triangle.edges[i].t2
// 				: triangle.edges[i].t1;
// 		if (neighbor !== null && !triangle.edges[i].crossed) {
// 			line(
// 				triangle.center.x,
// 				triangle.center.y,
// 				neighbor.center.x,
// 				neighbor.center.y
// 			);
// 			triangle.edges[i].crossed = true;
// 			voronoiDFS(neighbor);
// 		}
// 	}
// }

function findVoronoiCell(point) {
	let currentEdge = point.lastLineConnected;

	if (
		currentEdge === null ||
		currentEdge.t1 === null ||
		currentEdge.t2 === null
	) {
		return null;
	}

	let firstPoint = currentEdge.t1.center;
	let cellShape = [
		currentEdge.t1.center.toArray(),
		currentEdge.t2.center.toArray(),
	];
	let currentTriangle = currentEdge.t2;
	while (currentTriangle.center !== firstPoint) {
		let i = 0;
		for (i = 0; i < 3; i++) {
			if (
				currentEdge !== currentTriangle.edges[i] &&
				(currentTriangle.edges[i].p1 === point ||
					currentTriangle.edges[i].p2 === point)
			) {
				currentEdge = currentTriangle.edges[i];
				currentTriangle =
					currentEdge.t1 === currentTriangle
						? currentEdge.t2
						: currentEdge.t1;
				break;
			}
		}

		if (i === 3) {
			return null;
		}

		cellShape.push(currentTriangle.center.toArray());
	}

	return cellShape;
}

export function voronoi(data) {
	let points = data.map((pair) => new Point(pair[0], pair[1]));

	BowyerWatson(points);

	let cells = points.map((p) => {
		return findVoronoiCell(p);
	});

	return cells;
}
