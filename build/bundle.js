(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Springy v2.7.1
 *
 * Copyright (c) 2010-2013 Dennis Hotson
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function () {
            return (root.returnExportsGlobal = factory());
        });
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals
        root.Springy = factory();
    }
}(this, function() {

	var Springy = {};

	var Graph = Springy.Graph = function() {
		this.nodeSet = {};
		this.nodes = [];
		this.edges = [];
		this.adjacency = {};

		this.nextNodeId = 0;
		this.nextEdgeId = 0;
		this.eventListeners = [];
	};

	var Node = Springy.Node = function(id, data) {
		this.id = id;
		this.data = (data !== undefined) ? data : {};

	// Data fields used by layout algorithm in this file:
	// this.data.mass
	// Data used by default renderer in springyui.js
	// this.data.label
	};

	var Edge = Springy.Edge = function(id, source, target, data) {
		this.id = id;
		this.source = source;
		this.target = target;
		this.data = (data !== undefined) ? data : {};

	// Edge data field used by layout alorithm
	// this.data.length
	// this.data.type
	};

	Graph.prototype.addNode = function(node) {
		if (!(node.id in this.nodeSet)) {
			this.nodes.push(node);
		}

		this.nodeSet[node.id] = node;

		this.notify();
		return node;
	};

	Graph.prototype.addNodes = function() {
		// accepts variable number of arguments, where each argument
		// is a string that becomes both node identifier and label
		for (var i = 0; i < arguments.length; i++) {
			var name = arguments[i];
			var node = new Node(name, {label:name});
			this.addNode(node);
		}
	};

	Graph.prototype.addEdge = function(edge) {
		var exists = false;
		this.edges.forEach(function(e) {
			if (edge.id === e.id) { exists = true; }
		});

		if (!exists) {
			this.edges.push(edge);
		}

		if (!(edge.source.id in this.adjacency)) {
			this.adjacency[edge.source.id] = {};
		}
		if (!(edge.target.id in this.adjacency[edge.source.id])) {
			this.adjacency[edge.source.id][edge.target.id] = [];
		}

		exists = false;
		this.adjacency[edge.source.id][edge.target.id].forEach(function(e) {
				if (edge.id === e.id) { exists = true; }
		});

		if (!exists) {
			this.adjacency[edge.source.id][edge.target.id].push(edge);
		}

		this.notify();
		return edge;
	};

	Graph.prototype.addEdges = function() {
		// accepts variable number of arguments, where each argument
		// is a triple [nodeid1, nodeid2, attributes]
		for (var i = 0; i < arguments.length; i++) {
			var e = arguments[i];
			var node1 = this.nodeSet[e[0]];
			if (node1 == undefined) {
				throw new TypeError("invalid node name: " + e[0]);
			}
			var node2 = this.nodeSet[e[1]];
			if (node2 == undefined) {
				throw new TypeError("invalid node name: " + e[1]);
			}
			var attr = e[2];

			this.newEdge(node1, node2, attr);
		}
	};

	Graph.prototype.newNode = function(data) {
		var node = new Node(this.nextNodeId++, data);
		this.addNode(node);
		return node;
	};

	Graph.prototype.newEdge = function(source, target, data) {
		var edge = new Edge(this.nextEdgeId++, source, target, data);
		this.addEdge(edge);
		return edge;
	};


	// add nodes and edges from JSON object
	Graph.prototype.loadJSON = function(json) {
	/**
	Springy's simple JSON format for graphs.

	historically, Springy uses separate lists
	of nodes and edges:

		{
			"nodes": [
				"center",
				"left",
				"right",
				"up",
				"satellite"
			],
			"edges": [
				["center", "left"],
				["center", "right"],
				["center", "up"]
			]
		}

	**/
		// parse if a string is passed (EC5+ browsers)
		if (typeof json == 'string' || json instanceof String) {
			json = JSON.parse( json );
		}

		if ('nodes' in json || 'edges' in json) {
			this.addNodes.apply(this, json['nodes']);
			this.addEdges.apply(this, json['edges']);
		}
	}


	// find the edges from node1 to node2
	Graph.prototype.getEdges = function(node1, node2) {
		if (node1.id in this.adjacency
			&& node2.id in this.adjacency[node1.id]) {
			return this.adjacency[node1.id][node2.id];
		}

		return [];
	};

	// remove a node and it's associated edges from the graph
	Graph.prototype.removeNode = function(node) {
		if (node.id in this.nodeSet) {
			delete this.nodeSet[node.id];
		}

		for (var i = this.nodes.length - 1; i >= 0; i--) {
			if (this.nodes[i].id === node.id) {
				this.nodes.splice(i, 1);
			}
		}

		this.detachNode(node);
	};

	// removes edges associated with a given node
	Graph.prototype.detachNode = function(node) {
		var tmpEdges = this.edges.slice();
		tmpEdges.forEach(function(e) {
			if (e.source.id === node.id || e.target.id === node.id) {
				this.removeEdge(e);
			}
		}, this);

		this.notify();
	};

	// remove a node and it's associated edges from the graph
	Graph.prototype.removeEdge = function(edge) {
		for (var i = this.edges.length - 1; i >= 0; i--) {
			if (this.edges[i].id === edge.id) {
				this.edges.splice(i, 1);
			}
		}

		for (var x in this.adjacency) {
			for (var y in this.adjacency[x]) {
				var edges = this.adjacency[x][y];

				for (var j=edges.length - 1; j>=0; j--) {
					if (this.adjacency[x][y][j].id === edge.id) {
						this.adjacency[x][y].splice(j, 1);
					}
				}

				// Clean up empty edge arrays
				if (this.adjacency[x][y].length == 0) {
					delete this.adjacency[x][y];
				}
			}

			// Clean up empty objects
			if (isEmpty(this.adjacency[x])) {
				delete this.adjacency[x];
			}
		}

		this.notify();
	};

	/* Merge a list of nodes and edges into the current graph. eg.
	var o = {
		nodes: [
			{id: 123, data: {type: 'user', userid: 123, displayname: 'aaa'}},
			{id: 234, data: {type: 'user', userid: 234, displayname: 'bbb'}}
		],
		edges: [
			{from: 0, to: 1, type: 'submitted_design', directed: true, data: {weight: }}
		]
	}
	*/
	Graph.prototype.merge = function(data) {
		var nodes = [];
		data.nodes.forEach(function(n) {
			nodes.push(this.addNode(new Node(n.id, n.data)));
		}, this);

		data.edges.forEach(function(e) {
			var from = nodes[e.from];
			var to = nodes[e.to];

			var id = (e.directed)
				? (id = e.type + "-" + from.id + "-" + to.id)
				: (from.id < to.id) // normalise id for non-directed edges
					? e.type + "-" + from.id + "-" + to.id
					: e.type + "-" + to.id + "-" + from.id;

			var edge = this.addEdge(new Edge(id, from, to, e.data));
			edge.data.type = e.type;
		}, this);
	};

	Graph.prototype.filterNodes = function(fn) {
		var tmpNodes = this.nodes.slice();
		tmpNodes.forEach(function(n) {
			if (!fn(n)) {
				this.removeNode(n);
			}
		}, this);
	};

	Graph.prototype.filterEdges = function(fn) {
		var tmpEdges = this.edges.slice();
		tmpEdges.forEach(function(e) {
			if (!fn(e)) {
				this.removeEdge(e);
			}
		}, this);
	};


	Graph.prototype.addGraphListener = function(obj) {
		this.eventListeners.push(obj);
	};

	Graph.prototype.notify = function() {
		this.eventListeners.forEach(function(obj){
			obj.graphChanged();
		});
	};

	// -----------
	var Layout = Springy.Layout = {};
	Layout.ForceDirected = function(graph, stiffness, repulsion, damping, minEnergyThreshold) {
		this.graph = graph;
		this.stiffness = stiffness; // spring stiffness constant
		this.repulsion = repulsion; // repulsion constant
		this.damping = damping; // velocity damping factor
		this.minEnergyThreshold = minEnergyThreshold || 0.01; //threshold used to determine render stop

		this.nodePoints = {}; // keep track of points associated with nodes
		this.edgeSprings = {}; // keep track of springs associated with edges
	};

	Layout.ForceDirected.prototype.point = function(node) {
		if (!(node.id in this.nodePoints)) {
			var mass = (node.data.mass !== undefined) ? node.data.mass : 1.0;
			this.nodePoints[node.id] = new Layout.ForceDirected.Point(Vector.random(), mass);
		}

		return this.nodePoints[node.id];
	};

	Layout.ForceDirected.prototype.spring = function(edge) {
		if (!(edge.id in this.edgeSprings)) {
			var length = (edge.data.length !== undefined) ? edge.data.length : 1.0;

			var existingSpring = false;

			var from = this.graph.getEdges(edge.source, edge.target);
			from.forEach(function(e) {
				if (existingSpring === false && e.id in this.edgeSprings) {
					existingSpring = this.edgeSprings[e.id];
				}
			}, this);

			if (existingSpring !== false) {
				return new Layout.ForceDirected.Spring(existingSpring.point1, existingSpring.point2, 0.0, 0.0);
			}

			var to = this.graph.getEdges(edge.target, edge.source);
			from.forEach(function(e){
				if (existingSpring === false && e.id in this.edgeSprings) {
					existingSpring = this.edgeSprings[e.id];
				}
			}, this);

			if (existingSpring !== false) {
				return new Layout.ForceDirected.Spring(existingSpring.point2, existingSpring.point1, 0.0, 0.0);
			}

			this.edgeSprings[edge.id] = new Layout.ForceDirected.Spring(
				this.point(edge.source), this.point(edge.target), length, this.stiffness
			);
		}

		return this.edgeSprings[edge.id];
	};

	// callback should accept two arguments: Node, Point
	Layout.ForceDirected.prototype.eachNode = function(callback) {
		var t = this;
		this.graph.nodes.forEach(function(n){
			callback.call(t, n, t.point(n));
		});
	};

	// callback should accept two arguments: Edge, Spring
	Layout.ForceDirected.prototype.eachEdge = function(callback) {
		var t = this;
		this.graph.edges.forEach(function(e){
			callback.call(t, e, t.spring(e));
		});
	};

	// callback should accept one argument: Spring
	Layout.ForceDirected.prototype.eachSpring = function(callback) {
		var t = this;
		this.graph.edges.forEach(function(e){
			callback.call(t, t.spring(e));
		});
	};


	// Physics stuff
	Layout.ForceDirected.prototype.applyCoulombsLaw = function() {
		this.eachNode(function(n1, point1) {
			this.eachNode(function(n2, point2) {
				if (point1 !== point2)
				{
					var d = point1.p.subtract(point2.p);
					var distance = d.magnitude() + 0.1; // avoid massive forces at small distances (and divide by zero)
					var direction = d.normalise();

					// apply force to each end point
					point1.applyForce(direction.multiply(this.repulsion).divide(distance * distance * 0.5));
					point2.applyForce(direction.multiply(this.repulsion).divide(distance * distance * -0.5));
				}
			});
		});
	};

	Layout.ForceDirected.prototype.applyHookesLaw = function() {
		this.eachSpring(function(spring){
			var d = spring.point2.p.subtract(spring.point1.p); // the direction of the spring
			var displacement = spring.length - d.magnitude();
			var direction = d.normalise();

			// apply force to each end point
			spring.point1.applyForce(direction.multiply(spring.k * displacement * -0.5));
			spring.point2.applyForce(direction.multiply(spring.k * displacement * 0.5));
		});
	};

	Layout.ForceDirected.prototype.attractToCentre = function() {
		this.eachNode(function(node, point) {
			var direction = point.p.multiply(-1.0);
			point.applyForce(direction.multiply(this.repulsion / 50.0));
		});
	};


	Layout.ForceDirected.prototype.updateVelocity = function(timestep) {
		this.eachNode(function(node, point) {
			// Is this, along with updatePosition below, the only places that your
			// integration code exist?
			point.v = point.v.add(point.a.multiply(timestep)).multiply(this.damping);
			point.a = new Vector(0,0);
		});
	};

	Layout.ForceDirected.prototype.updatePosition = function(timestep) {
		this.eachNode(function(node, point) {
			// Same question as above; along with updateVelocity, is this all of
			// your integration code?
			point.p = point.p.add(point.v.multiply(timestep));
		});
	};

	// Calculate the total kinetic energy of the system
	Layout.ForceDirected.prototype.totalEnergy = function(timestep) {
		var energy = 0.0;
		this.eachNode(function(node, point) {
			var speed = point.v.magnitude();
			energy += 0.5 * point.m * speed * speed;
		});

		return energy;
	};

	var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }; // stolen from coffeescript, thanks jashkenas! ;-)

	Springy.requestAnimationFrame = __bind(this.requestAnimationFrame ||
		this.webkitRequestAnimationFrame ||
		this.mozRequestAnimationFrame ||
		this.oRequestAnimationFrame ||
		this.msRequestAnimationFrame ||
		(function(callback, element) {
			this.setTimeout(callback, 10);
		}), this);


	/**
	 * Start simulation if it's not running already.
	 * In case it's running then the call is ignored, and none of the callbacks passed is ever executed.
	 */
	Layout.ForceDirected.prototype.start = function(render, onRenderStop, onRenderStart) {
		var t = this;

		if (this._started) return;
		this._started = true;
		this._stop = false;

		if (onRenderStart !== undefined) { onRenderStart(); }

		Springy.requestAnimationFrame(function step() {
			t.tick(0.03);

			if (render !== undefined) {
				render();
			}

			// stop simulation when energy of the system goes below a threshold
			if (t._stop || t.totalEnergy() < t.minEnergyThreshold) {
				t._started = false;
				if (onRenderStop !== undefined) { onRenderStop(); }
			} else {
				Springy.requestAnimationFrame(step);
			}
		});
	};

	Layout.ForceDirected.prototype.stop = function() {
		this._stop = true;
	}

	Layout.ForceDirected.prototype.tick = function(timestep) {
		this.applyCoulombsLaw();
		this.applyHookesLaw();
		this.attractToCentre();
		this.updateVelocity(timestep);
		this.updatePosition(timestep);
	};

	// Find the nearest point to a particular position
	Layout.ForceDirected.prototype.nearest = function(pos) {
		var min = {node: null, point: null, distance: null};
		var t = this;
		this.graph.nodes.forEach(function(n){
			var point = t.point(n);
			var distance = point.p.subtract(pos).magnitude();

			if (min.distance === null || distance < min.distance) {
				min = {node: n, point: point, distance: distance};
			}
		});

		return min;
	};

	// returns [bottomleft, topright]
	Layout.ForceDirected.prototype.getBoundingBox = function() {
		var bottomleft = new Vector(-2,-2);
		var topright = new Vector(2,2);

		this.eachNode(function(n, point) {
			if (point.p.x < bottomleft.x) {
				bottomleft.x = point.p.x;
			}
			if (point.p.y < bottomleft.y) {
				bottomleft.y = point.p.y;
			}
			if (point.p.x > topright.x) {
				topright.x = point.p.x;
			}
			if (point.p.y > topright.y) {
				topright.y = point.p.y;
			}
		});

		var padding = topright.subtract(bottomleft).multiply(0.07); // ~5% padding

		return {bottomleft: bottomleft.subtract(padding), topright: topright.add(padding)};
	};


	// Vector
	var Vector = Springy.Vector = function(x, y) {
		this.x = x;
		this.y = y;
	};

	Vector.random = function() {
		return new Vector(10.0 * (Math.random() - 0.5), 10.0 * (Math.random() - 0.5));
	};

	Vector.prototype.add = function(v2) {
		return new Vector(this.x + v2.x, this.y + v2.y);
	};

	Vector.prototype.subtract = function(v2) {
		return new Vector(this.x - v2.x, this.y - v2.y);
	};

	Vector.prototype.multiply = function(n) {
		return new Vector(this.x * n, this.y * n);
	};

	Vector.prototype.divide = function(n) {
		return new Vector((this.x / n) || 0, (this.y / n) || 0); // Avoid divide by zero errors..
	};

	Vector.prototype.magnitude = function() {
		return Math.sqrt(this.x*this.x + this.y*this.y);
	};

	Vector.prototype.normal = function() {
		return new Vector(-this.y, this.x);
	};

	Vector.prototype.normalise = function() {
		return this.divide(this.magnitude());
	};

	// Point
	Layout.ForceDirected.Point = function(position, mass) {
		this.p = position; // position
		this.m = mass; // mass
		this.v = new Vector(0, 0); // velocity
		this.a = new Vector(0, 0); // acceleration
	};

	Layout.ForceDirected.Point.prototype.applyForce = function(force) {
		this.a = this.a.add(force.divide(this.m));
	};

	// Spring
	Layout.ForceDirected.Spring = function(point1, point2, length, k) {
		this.point1 = point1;
		this.point2 = point2;
		this.length = length; // spring length at rest
		this.k = k; // spring constant (See Hooke's law) .. how stiff the spring is
	};

	// Layout.ForceDirected.Spring.prototype.distanceToPoint = function(point)
	// {
	// 	// hardcore vector arithmetic.. ohh yeah!
	// 	// .. see http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment/865080#865080
	// 	var n = this.point2.p.subtract(this.point1.p).normalise().normal();
	// 	var ac = point.p.subtract(this.point1.p);
	// 	return Math.abs(ac.x * n.x + ac.y * n.y);
	// };

	/**
	 * Renderer handles the layout rendering loop
	 * @param onRenderStop optional callback function that gets executed whenever rendering stops.
	 * @param onRenderStart optional callback function that gets executed whenever rendering starts.
	 */
	var Renderer = Springy.Renderer = function(layout, clear, drawEdge, drawNode, onRenderStop, onRenderStart) {
		this.layout = layout;
		this.clear = clear;
		this.drawEdge = drawEdge;
		this.drawNode = drawNode;
		this.onRenderStop = onRenderStop;
		this.onRenderStart = onRenderStart;

		this.layout.graph.addGraphListener(this);
	}

	Renderer.prototype.graphChanged = function(e) {
		this.start();
	};

	/**
	 * Starts the simulation of the layout in use.
	 *
	 * Note that in case the algorithm is still or already running then the layout that's in use
	 * might silently ignore the call, and your optional <code>done</code> callback is never executed.
	 * At least the built-in ForceDirected layout behaves in this way.
	 *
	 * @param done An optional callback function that gets executed when the springy algorithm stops,
	 * either because it ended or because stop() was called.
	 */
	Renderer.prototype.start = function(done) {
		var t = this;
		this.layout.start(function render() {
			t.clear();

			t.layout.eachEdge(function(edge, spring) {
				t.drawEdge(edge, spring.point1.p, spring.point2.p);
			});

			t.layout.eachNode(function(node, point) {
				t.drawNode(node, point.p);
			});
		}, this.onRenderStop, this.onRenderStart);
	};

	Renderer.prototype.stop = function() {
		this.layout.stop();
	};

	// Array.forEach implementation for IE support..
	//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
	if ( !Array.prototype.forEach ) {
		Array.prototype.forEach = function( callback, thisArg ) {
			var T, k;
			if ( this == null ) {
				throw new TypeError( " this is null or not defined" );
			}
			var O = Object(this);
			var len = O.length >>> 0; // Hack to convert O.length to a UInt32
			if ( {}.toString.call(callback) != "[object Function]" ) {
				throw new TypeError( callback + " is not a function" );
			}
			if ( thisArg ) {
				T = thisArg;
			}
			k = 0;
			while( k < len ) {
				var kValue;
				if ( k in O ) {
					kValue = O[ k ];
					callback.call( T, kValue, k, O );
				}
				k++;
			}
		};
	}

	var isEmpty = function(obj) {
		for (var k in obj) {
			if (obj.hasOwnProperty(k)) {
				return false;
			}
		}
		return true;
	};

  return Springy;
}));

},{}],2:[function(require,module,exports){
'use strict';

var _springy = require('springy');

var _springy2 = _interopRequireDefault(_springy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

console.log(_springy2.default);

},{"springy":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvc3ByaW5neS9zcHJpbmd5LmpzIiwic3JjL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdnRCQTs7Ozs7O0FBRUEsUUFBUSxHQUFSIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogU3ByaW5neSB2Mi43LjFcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBEZW5uaXMgSG90c29uXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb25cbiAqIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uXG4gKiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXRcbiAqIHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLFxuICogY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZVxuICogU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmdcbiAqIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gKiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVNcbiAqIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EXG4gKiBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVFxuICogSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksXG4gKiBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkdcbiAqIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1JcbiAqIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG4gICAgICAgIGRlZmluZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKHJvb3QucmV0dXJuRXhwb3J0c0dsb2JhbCA9IGZhY3RvcnkoKSk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIC8vIE5vZGUuIERvZXMgbm90IHdvcmsgd2l0aCBzdHJpY3QgQ29tbW9uSlMsIGJ1dFxuICAgICAgICAvLyBvbmx5IENvbW1vbkpTLWxpa2UgZW52aXJvbWVudHMgdGhhdCBzdXBwb3J0IG1vZHVsZS5leHBvcnRzLFxuICAgICAgICAvLyBsaWtlIE5vZGUuXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEJyb3dzZXIgZ2xvYmFsc1xuICAgICAgICByb290LlNwcmluZ3kgPSBmYWN0b3J5KCk7XG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbigpIHtcblxuXHR2YXIgU3ByaW5neSA9IHt9O1xuXG5cdHZhciBHcmFwaCA9IFNwcmluZ3kuR3JhcGggPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm5vZGVTZXQgPSB7fTtcblx0XHR0aGlzLm5vZGVzID0gW107XG5cdFx0dGhpcy5lZGdlcyA9IFtdO1xuXHRcdHRoaXMuYWRqYWNlbmN5ID0ge307XG5cblx0XHR0aGlzLm5leHROb2RlSWQgPSAwO1xuXHRcdHRoaXMubmV4dEVkZ2VJZCA9IDA7XG5cdFx0dGhpcy5ldmVudExpc3RlbmVycyA9IFtdO1xuXHR9O1xuXG5cdHZhciBOb2RlID0gU3ByaW5neS5Ob2RlID0gZnVuY3Rpb24oaWQsIGRhdGEpIHtcblx0XHR0aGlzLmlkID0gaWQ7XG5cdFx0dGhpcy5kYXRhID0gKGRhdGEgIT09IHVuZGVmaW5lZCkgPyBkYXRhIDoge307XG5cblx0Ly8gRGF0YSBmaWVsZHMgdXNlZCBieSBsYXlvdXQgYWxnb3JpdGhtIGluIHRoaXMgZmlsZTpcblx0Ly8gdGhpcy5kYXRhLm1hc3Ncblx0Ly8gRGF0YSB1c2VkIGJ5IGRlZmF1bHQgcmVuZGVyZXIgaW4gc3ByaW5neXVpLmpzXG5cdC8vIHRoaXMuZGF0YS5sYWJlbFxuXHR9O1xuXG5cdHZhciBFZGdlID0gU3ByaW5neS5FZGdlID0gZnVuY3Rpb24oaWQsIHNvdXJjZSwgdGFyZ2V0LCBkYXRhKSB7XG5cdFx0dGhpcy5pZCA9IGlkO1xuXHRcdHRoaXMuc291cmNlID0gc291cmNlO1xuXHRcdHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuXHRcdHRoaXMuZGF0YSA9IChkYXRhICE9PSB1bmRlZmluZWQpID8gZGF0YSA6IHt9O1xuXG5cdC8vIEVkZ2UgZGF0YSBmaWVsZCB1c2VkIGJ5IGxheW91dCBhbG9yaXRobVxuXHQvLyB0aGlzLmRhdGEubGVuZ3RoXG5cdC8vIHRoaXMuZGF0YS50eXBlXG5cdH07XG5cblx0R3JhcGgucHJvdG90eXBlLmFkZE5vZGUgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0aWYgKCEobm9kZS5pZCBpbiB0aGlzLm5vZGVTZXQpKSB7XG5cdFx0XHR0aGlzLm5vZGVzLnB1c2gobm9kZSk7XG5cdFx0fVxuXG5cdFx0dGhpcy5ub2RlU2V0W25vZGUuaWRdID0gbm9kZTtcblxuXHRcdHRoaXMubm90aWZ5KCk7XG5cdFx0cmV0dXJuIG5vZGU7XG5cdH07XG5cblx0R3JhcGgucHJvdG90eXBlLmFkZE5vZGVzID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gYWNjZXB0cyB2YXJpYWJsZSBudW1iZXIgb2YgYXJndW1lbnRzLCB3aGVyZSBlYWNoIGFyZ3VtZW50XG5cdFx0Ly8gaXMgYSBzdHJpbmcgdGhhdCBiZWNvbWVzIGJvdGggbm9kZSBpZGVudGlmaWVyIGFuZCBsYWJlbFxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgbmFtZSA9IGFyZ3VtZW50c1tpXTtcblx0XHRcdHZhciBub2RlID0gbmV3IE5vZGUobmFtZSwge2xhYmVsOm5hbWV9KTtcblx0XHRcdHRoaXMuYWRkTm9kZShub2RlKTtcblx0XHR9XG5cdH07XG5cblx0R3JhcGgucHJvdG90eXBlLmFkZEVkZ2UgPSBmdW5jdGlvbihlZGdlKSB7XG5cdFx0dmFyIGV4aXN0cyA9IGZhbHNlO1xuXHRcdHRoaXMuZWRnZXMuZm9yRWFjaChmdW5jdGlvbihlKSB7XG5cdFx0XHRpZiAoZWRnZS5pZCA9PT0gZS5pZCkgeyBleGlzdHMgPSB0cnVlOyB9XG5cdFx0fSk7XG5cblx0XHRpZiAoIWV4aXN0cykge1xuXHRcdFx0dGhpcy5lZGdlcy5wdXNoKGVkZ2UpO1xuXHRcdH1cblxuXHRcdGlmICghKGVkZ2Uuc291cmNlLmlkIGluIHRoaXMuYWRqYWNlbmN5KSkge1xuXHRcdFx0dGhpcy5hZGphY2VuY3lbZWRnZS5zb3VyY2UuaWRdID0ge307XG5cdFx0fVxuXHRcdGlmICghKGVkZ2UudGFyZ2V0LmlkIGluIHRoaXMuYWRqYWNlbmN5W2VkZ2Uuc291cmNlLmlkXSkpIHtcblx0XHRcdHRoaXMuYWRqYWNlbmN5W2VkZ2Uuc291cmNlLmlkXVtlZGdlLnRhcmdldC5pZF0gPSBbXTtcblx0XHR9XG5cblx0XHRleGlzdHMgPSBmYWxzZTtcblx0XHR0aGlzLmFkamFjZW5jeVtlZGdlLnNvdXJjZS5pZF1bZWRnZS50YXJnZXQuaWRdLmZvckVhY2goZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRpZiAoZWRnZS5pZCA9PT0gZS5pZCkgeyBleGlzdHMgPSB0cnVlOyB9XG5cdFx0fSk7XG5cblx0XHRpZiAoIWV4aXN0cykge1xuXHRcdFx0dGhpcy5hZGphY2VuY3lbZWRnZS5zb3VyY2UuaWRdW2VkZ2UudGFyZ2V0LmlkXS5wdXNoKGVkZ2UpO1xuXHRcdH1cblxuXHRcdHRoaXMubm90aWZ5KCk7XG5cdFx0cmV0dXJuIGVkZ2U7XG5cdH07XG5cblx0R3JhcGgucHJvdG90eXBlLmFkZEVkZ2VzID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gYWNjZXB0cyB2YXJpYWJsZSBudW1iZXIgb2YgYXJndW1lbnRzLCB3aGVyZSBlYWNoIGFyZ3VtZW50XG5cdFx0Ly8gaXMgYSB0cmlwbGUgW25vZGVpZDEsIG5vZGVpZDIsIGF0dHJpYnV0ZXNdXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBlID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0dmFyIG5vZGUxID0gdGhpcy5ub2RlU2V0W2VbMF1dO1xuXHRcdFx0aWYgKG5vZGUxID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKFwiaW52YWxpZCBub2RlIG5hbWU6IFwiICsgZVswXSk7XG5cdFx0XHR9XG5cdFx0XHR2YXIgbm9kZTIgPSB0aGlzLm5vZGVTZXRbZVsxXV07XG5cdFx0XHRpZiAobm9kZTIgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoXCJpbnZhbGlkIG5vZGUgbmFtZTogXCIgKyBlWzFdKTtcblx0XHRcdH1cblx0XHRcdHZhciBhdHRyID0gZVsyXTtcblxuXHRcdFx0dGhpcy5uZXdFZGdlKG5vZGUxLCBub2RlMiwgYXR0cik7XG5cdFx0fVxuXHR9O1xuXG5cdEdyYXBoLnByb3RvdHlwZS5uZXdOb2RlID0gZnVuY3Rpb24oZGF0YSkge1xuXHRcdHZhciBub2RlID0gbmV3IE5vZGUodGhpcy5uZXh0Tm9kZUlkKyssIGRhdGEpO1xuXHRcdHRoaXMuYWRkTm9kZShub2RlKTtcblx0XHRyZXR1cm4gbm9kZTtcblx0fTtcblxuXHRHcmFwaC5wcm90b3R5cGUubmV3RWRnZSA9IGZ1bmN0aW9uKHNvdXJjZSwgdGFyZ2V0LCBkYXRhKSB7XG5cdFx0dmFyIGVkZ2UgPSBuZXcgRWRnZSh0aGlzLm5leHRFZGdlSWQrKywgc291cmNlLCB0YXJnZXQsIGRhdGEpO1xuXHRcdHRoaXMuYWRkRWRnZShlZGdlKTtcblx0XHRyZXR1cm4gZWRnZTtcblx0fTtcblxuXG5cdC8vIGFkZCBub2RlcyBhbmQgZWRnZXMgZnJvbSBKU09OIG9iamVjdFxuXHRHcmFwaC5wcm90b3R5cGUubG9hZEpTT04gPSBmdW5jdGlvbihqc29uKSB7XG5cdC8qKlxuXHRTcHJpbmd5J3Mgc2ltcGxlIEpTT04gZm9ybWF0IGZvciBncmFwaHMuXG5cblx0aGlzdG9yaWNhbGx5LCBTcHJpbmd5IHVzZXMgc2VwYXJhdGUgbGlzdHNcblx0b2Ygbm9kZXMgYW5kIGVkZ2VzOlxuXG5cdFx0e1xuXHRcdFx0XCJub2Rlc1wiOiBbXG5cdFx0XHRcdFwiY2VudGVyXCIsXG5cdFx0XHRcdFwibGVmdFwiLFxuXHRcdFx0XHRcInJpZ2h0XCIsXG5cdFx0XHRcdFwidXBcIixcblx0XHRcdFx0XCJzYXRlbGxpdGVcIlxuXHRcdFx0XSxcblx0XHRcdFwiZWRnZXNcIjogW1xuXHRcdFx0XHRbXCJjZW50ZXJcIiwgXCJsZWZ0XCJdLFxuXHRcdFx0XHRbXCJjZW50ZXJcIiwgXCJyaWdodFwiXSxcblx0XHRcdFx0W1wiY2VudGVyXCIsIFwidXBcIl1cblx0XHRcdF1cblx0XHR9XG5cblx0KiovXG5cdFx0Ly8gcGFyc2UgaWYgYSBzdHJpbmcgaXMgcGFzc2VkIChFQzUrIGJyb3dzZXJzKVxuXHRcdGlmICh0eXBlb2YganNvbiA9PSAnc3RyaW5nJyB8fCBqc29uIGluc3RhbmNlb2YgU3RyaW5nKSB7XG5cdFx0XHRqc29uID0gSlNPTi5wYXJzZSgganNvbiApO1xuXHRcdH1cblxuXHRcdGlmICgnbm9kZXMnIGluIGpzb24gfHwgJ2VkZ2VzJyBpbiBqc29uKSB7XG5cdFx0XHR0aGlzLmFkZE5vZGVzLmFwcGx5KHRoaXMsIGpzb25bJ25vZGVzJ10pO1xuXHRcdFx0dGhpcy5hZGRFZGdlcy5hcHBseSh0aGlzLCBqc29uWydlZGdlcyddKTtcblx0XHR9XG5cdH1cblxuXG5cdC8vIGZpbmQgdGhlIGVkZ2VzIGZyb20gbm9kZTEgdG8gbm9kZTJcblx0R3JhcGgucHJvdG90eXBlLmdldEVkZ2VzID0gZnVuY3Rpb24obm9kZTEsIG5vZGUyKSB7XG5cdFx0aWYgKG5vZGUxLmlkIGluIHRoaXMuYWRqYWNlbmN5XG5cdFx0XHQmJiBub2RlMi5pZCBpbiB0aGlzLmFkamFjZW5jeVtub2RlMS5pZF0pIHtcblx0XHRcdHJldHVybiB0aGlzLmFkamFjZW5jeVtub2RlMS5pZF1bbm9kZTIuaWRdO1xuXHRcdH1cblxuXHRcdHJldHVybiBbXTtcblx0fTtcblxuXHQvLyByZW1vdmUgYSBub2RlIGFuZCBpdCdzIGFzc29jaWF0ZWQgZWRnZXMgZnJvbSB0aGUgZ3JhcGhcblx0R3JhcGgucHJvdG90eXBlLnJlbW92ZU5vZGUgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0aWYgKG5vZGUuaWQgaW4gdGhpcy5ub2RlU2V0KSB7XG5cdFx0XHRkZWxldGUgdGhpcy5ub2RlU2V0W25vZGUuaWRdO1xuXHRcdH1cblxuXHRcdGZvciAodmFyIGkgPSB0aGlzLm5vZGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRpZiAodGhpcy5ub2Rlc1tpXS5pZCA9PT0gbm9kZS5pZCkge1xuXHRcdFx0XHR0aGlzLm5vZGVzLnNwbGljZShpLCAxKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLmRldGFjaE5vZGUobm9kZSk7XG5cdH07XG5cblx0Ly8gcmVtb3ZlcyBlZGdlcyBhc3NvY2lhdGVkIHdpdGggYSBnaXZlbiBub2RlXG5cdEdyYXBoLnByb3RvdHlwZS5kZXRhY2hOb2RlID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdHZhciB0bXBFZGdlcyA9IHRoaXMuZWRnZXMuc2xpY2UoKTtcblx0XHR0bXBFZGdlcy5mb3JFYWNoKGZ1bmN0aW9uKGUpIHtcblx0XHRcdGlmIChlLnNvdXJjZS5pZCA9PT0gbm9kZS5pZCB8fCBlLnRhcmdldC5pZCA9PT0gbm9kZS5pZCkge1xuXHRcdFx0XHR0aGlzLnJlbW92ZUVkZ2UoZSk7XG5cdFx0XHR9XG5cdFx0fSwgdGhpcyk7XG5cblx0XHR0aGlzLm5vdGlmeSgpO1xuXHR9O1xuXG5cdC8vIHJlbW92ZSBhIG5vZGUgYW5kIGl0J3MgYXNzb2NpYXRlZCBlZGdlcyBmcm9tIHRoZSBncmFwaFxuXHRHcmFwaC5wcm90b3R5cGUucmVtb3ZlRWRnZSA9IGZ1bmN0aW9uKGVkZ2UpIHtcblx0XHRmb3IgKHZhciBpID0gdGhpcy5lZGdlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0aWYgKHRoaXMuZWRnZXNbaV0uaWQgPT09IGVkZ2UuaWQpIHtcblx0XHRcdFx0dGhpcy5lZGdlcy5zcGxpY2UoaSwgMSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIgeCBpbiB0aGlzLmFkamFjZW5jeSkge1xuXHRcdFx0Zm9yICh2YXIgeSBpbiB0aGlzLmFkamFjZW5jeVt4XSkge1xuXHRcdFx0XHR2YXIgZWRnZXMgPSB0aGlzLmFkamFjZW5jeVt4XVt5XTtcblxuXHRcdFx0XHRmb3IgKHZhciBqPWVkZ2VzLmxlbmd0aCAtIDE7IGo+PTA7IGotLSkge1xuXHRcdFx0XHRcdGlmICh0aGlzLmFkamFjZW5jeVt4XVt5XVtqXS5pZCA9PT0gZWRnZS5pZCkge1xuXHRcdFx0XHRcdFx0dGhpcy5hZGphY2VuY3lbeF1beV0uc3BsaWNlKGosIDEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIENsZWFuIHVwIGVtcHR5IGVkZ2UgYXJyYXlzXG5cdFx0XHRcdGlmICh0aGlzLmFkamFjZW5jeVt4XVt5XS5sZW5ndGggPT0gMCkge1xuXHRcdFx0XHRcdGRlbGV0ZSB0aGlzLmFkamFjZW5jeVt4XVt5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBDbGVhbiB1cCBlbXB0eSBvYmplY3RzXG5cdFx0XHRpZiAoaXNFbXB0eSh0aGlzLmFkamFjZW5jeVt4XSkpIHtcblx0XHRcdFx0ZGVsZXRlIHRoaXMuYWRqYWNlbmN5W3hdO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMubm90aWZ5KCk7XG5cdH07XG5cblx0LyogTWVyZ2UgYSBsaXN0IG9mIG5vZGVzIGFuZCBlZGdlcyBpbnRvIHRoZSBjdXJyZW50IGdyYXBoLiBlZy5cblx0dmFyIG8gPSB7XG5cdFx0bm9kZXM6IFtcblx0XHRcdHtpZDogMTIzLCBkYXRhOiB7dHlwZTogJ3VzZXInLCB1c2VyaWQ6IDEyMywgZGlzcGxheW5hbWU6ICdhYWEnfX0sXG5cdFx0XHR7aWQ6IDIzNCwgZGF0YToge3R5cGU6ICd1c2VyJywgdXNlcmlkOiAyMzQsIGRpc3BsYXluYW1lOiAnYmJiJ319XG5cdFx0XSxcblx0XHRlZGdlczogW1xuXHRcdFx0e2Zyb206IDAsIHRvOiAxLCB0eXBlOiAnc3VibWl0dGVkX2Rlc2lnbicsIGRpcmVjdGVkOiB0cnVlLCBkYXRhOiB7d2VpZ2h0OiB9fVxuXHRcdF1cblx0fVxuXHQqL1xuXHRHcmFwaC5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIG5vZGVzID0gW107XG5cdFx0ZGF0YS5ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uKG4pIHtcblx0XHRcdG5vZGVzLnB1c2godGhpcy5hZGROb2RlKG5ldyBOb2RlKG4uaWQsIG4uZGF0YSkpKTtcblx0XHR9LCB0aGlzKTtcblxuXHRcdGRhdGEuZWRnZXMuZm9yRWFjaChmdW5jdGlvbihlKSB7XG5cdFx0XHR2YXIgZnJvbSA9IG5vZGVzW2UuZnJvbV07XG5cdFx0XHR2YXIgdG8gPSBub2Rlc1tlLnRvXTtcblxuXHRcdFx0dmFyIGlkID0gKGUuZGlyZWN0ZWQpXG5cdFx0XHRcdD8gKGlkID0gZS50eXBlICsgXCItXCIgKyBmcm9tLmlkICsgXCItXCIgKyB0by5pZClcblx0XHRcdFx0OiAoZnJvbS5pZCA8IHRvLmlkKSAvLyBub3JtYWxpc2UgaWQgZm9yIG5vbi1kaXJlY3RlZCBlZGdlc1xuXHRcdFx0XHRcdD8gZS50eXBlICsgXCItXCIgKyBmcm9tLmlkICsgXCItXCIgKyB0by5pZFxuXHRcdFx0XHRcdDogZS50eXBlICsgXCItXCIgKyB0by5pZCArIFwiLVwiICsgZnJvbS5pZDtcblxuXHRcdFx0dmFyIGVkZ2UgPSB0aGlzLmFkZEVkZ2UobmV3IEVkZ2UoaWQsIGZyb20sIHRvLCBlLmRhdGEpKTtcblx0XHRcdGVkZ2UuZGF0YS50eXBlID0gZS50eXBlO1xuXHRcdH0sIHRoaXMpO1xuXHR9O1xuXG5cdEdyYXBoLnByb3RvdHlwZS5maWx0ZXJOb2RlcyA9IGZ1bmN0aW9uKGZuKSB7XG5cdFx0dmFyIHRtcE5vZGVzID0gdGhpcy5ub2Rlcy5zbGljZSgpO1xuXHRcdHRtcE5vZGVzLmZvckVhY2goZnVuY3Rpb24obikge1xuXHRcdFx0aWYgKCFmbihuKSkge1xuXHRcdFx0XHR0aGlzLnJlbW92ZU5vZGUobik7XG5cdFx0XHR9XG5cdFx0fSwgdGhpcyk7XG5cdH07XG5cblx0R3JhcGgucHJvdG90eXBlLmZpbHRlckVkZ2VzID0gZnVuY3Rpb24oZm4pIHtcblx0XHR2YXIgdG1wRWRnZXMgPSB0aGlzLmVkZ2VzLnNsaWNlKCk7XG5cdFx0dG1wRWRnZXMuZm9yRWFjaChmdW5jdGlvbihlKSB7XG5cdFx0XHRpZiAoIWZuKGUpKSB7XG5cdFx0XHRcdHRoaXMucmVtb3ZlRWRnZShlKTtcblx0XHRcdH1cblx0XHR9LCB0aGlzKTtcblx0fTtcblxuXG5cdEdyYXBoLnByb3RvdHlwZS5hZGRHcmFwaExpc3RlbmVyID0gZnVuY3Rpb24ob2JqKSB7XG5cdFx0dGhpcy5ldmVudExpc3RlbmVycy5wdXNoKG9iaik7XG5cdH07XG5cblx0R3JhcGgucHJvdG90eXBlLm5vdGlmeSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZXZlbnRMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihvYmope1xuXHRcdFx0b2JqLmdyYXBoQ2hhbmdlZCgpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdC8vIC0tLS0tLS0tLS0tXG5cdHZhciBMYXlvdXQgPSBTcHJpbmd5LkxheW91dCA9IHt9O1xuXHRMYXlvdXQuRm9yY2VEaXJlY3RlZCA9IGZ1bmN0aW9uKGdyYXBoLCBzdGlmZm5lc3MsIHJlcHVsc2lvbiwgZGFtcGluZywgbWluRW5lcmd5VGhyZXNob2xkKSB7XG5cdFx0dGhpcy5ncmFwaCA9IGdyYXBoO1xuXHRcdHRoaXMuc3RpZmZuZXNzID0gc3RpZmZuZXNzOyAvLyBzcHJpbmcgc3RpZmZuZXNzIGNvbnN0YW50XG5cdFx0dGhpcy5yZXB1bHNpb24gPSByZXB1bHNpb247IC8vIHJlcHVsc2lvbiBjb25zdGFudFxuXHRcdHRoaXMuZGFtcGluZyA9IGRhbXBpbmc7IC8vIHZlbG9jaXR5IGRhbXBpbmcgZmFjdG9yXG5cdFx0dGhpcy5taW5FbmVyZ3lUaHJlc2hvbGQgPSBtaW5FbmVyZ3lUaHJlc2hvbGQgfHwgMC4wMTsgLy90aHJlc2hvbGQgdXNlZCB0byBkZXRlcm1pbmUgcmVuZGVyIHN0b3BcblxuXHRcdHRoaXMubm9kZVBvaW50cyA9IHt9OyAvLyBrZWVwIHRyYWNrIG9mIHBvaW50cyBhc3NvY2lhdGVkIHdpdGggbm9kZXNcblx0XHR0aGlzLmVkZ2VTcHJpbmdzID0ge307IC8vIGtlZXAgdHJhY2sgb2Ygc3ByaW5ncyBhc3NvY2lhdGVkIHdpdGggZWRnZXNcblx0fTtcblxuXHRMYXlvdXQuRm9yY2VEaXJlY3RlZC5wcm90b3R5cGUucG9pbnQgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0aWYgKCEobm9kZS5pZCBpbiB0aGlzLm5vZGVQb2ludHMpKSB7XG5cdFx0XHR2YXIgbWFzcyA9IChub2RlLmRhdGEubWFzcyAhPT0gdW5kZWZpbmVkKSA/IG5vZGUuZGF0YS5tYXNzIDogMS4wO1xuXHRcdFx0dGhpcy5ub2RlUG9pbnRzW25vZGUuaWRdID0gbmV3IExheW91dC5Gb3JjZURpcmVjdGVkLlBvaW50KFZlY3Rvci5yYW5kb20oKSwgbWFzcyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMubm9kZVBvaW50c1tub2RlLmlkXTtcblx0fTtcblxuXHRMYXlvdXQuRm9yY2VEaXJlY3RlZC5wcm90b3R5cGUuc3ByaW5nID0gZnVuY3Rpb24oZWRnZSkge1xuXHRcdGlmICghKGVkZ2UuaWQgaW4gdGhpcy5lZGdlU3ByaW5ncykpIHtcblx0XHRcdHZhciBsZW5ndGggPSAoZWRnZS5kYXRhLmxlbmd0aCAhPT0gdW5kZWZpbmVkKSA/IGVkZ2UuZGF0YS5sZW5ndGggOiAxLjA7XG5cblx0XHRcdHZhciBleGlzdGluZ1NwcmluZyA9IGZhbHNlO1xuXG5cdFx0XHR2YXIgZnJvbSA9IHRoaXMuZ3JhcGguZ2V0RWRnZXMoZWRnZS5zb3VyY2UsIGVkZ2UudGFyZ2V0KTtcblx0XHRcdGZyb20uZm9yRWFjaChmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGlmIChleGlzdGluZ1NwcmluZyA9PT0gZmFsc2UgJiYgZS5pZCBpbiB0aGlzLmVkZ2VTcHJpbmdzKSB7XG5cdFx0XHRcdFx0ZXhpc3RpbmdTcHJpbmcgPSB0aGlzLmVkZ2VTcHJpbmdzW2UuaWRdO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB0aGlzKTtcblxuXHRcdFx0aWYgKGV4aXN0aW5nU3ByaW5nICE9PSBmYWxzZSkge1xuXHRcdFx0XHRyZXR1cm4gbmV3IExheW91dC5Gb3JjZURpcmVjdGVkLlNwcmluZyhleGlzdGluZ1NwcmluZy5wb2ludDEsIGV4aXN0aW5nU3ByaW5nLnBvaW50MiwgMC4wLCAwLjApO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgdG8gPSB0aGlzLmdyYXBoLmdldEVkZ2VzKGVkZ2UudGFyZ2V0LCBlZGdlLnNvdXJjZSk7XG5cdFx0XHRmcm9tLmZvckVhY2goZnVuY3Rpb24oZSl7XG5cdFx0XHRcdGlmIChleGlzdGluZ1NwcmluZyA9PT0gZmFsc2UgJiYgZS5pZCBpbiB0aGlzLmVkZ2VTcHJpbmdzKSB7XG5cdFx0XHRcdFx0ZXhpc3RpbmdTcHJpbmcgPSB0aGlzLmVkZ2VTcHJpbmdzW2UuaWRdO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB0aGlzKTtcblxuXHRcdFx0aWYgKGV4aXN0aW5nU3ByaW5nICE9PSBmYWxzZSkge1xuXHRcdFx0XHRyZXR1cm4gbmV3IExheW91dC5Gb3JjZURpcmVjdGVkLlNwcmluZyhleGlzdGluZ1NwcmluZy5wb2ludDIsIGV4aXN0aW5nU3ByaW5nLnBvaW50MSwgMC4wLCAwLjApO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmVkZ2VTcHJpbmdzW2VkZ2UuaWRdID0gbmV3IExheW91dC5Gb3JjZURpcmVjdGVkLlNwcmluZyhcblx0XHRcdFx0dGhpcy5wb2ludChlZGdlLnNvdXJjZSksIHRoaXMucG9pbnQoZWRnZS50YXJnZXQpLCBsZW5ndGgsIHRoaXMuc3RpZmZuZXNzXG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLmVkZ2VTcHJpbmdzW2VkZ2UuaWRdO1xuXHR9O1xuXG5cdC8vIGNhbGxiYWNrIHNob3VsZCBhY2NlcHQgdHdvIGFyZ3VtZW50czogTm9kZSwgUG9pbnRcblx0TGF5b3V0LkZvcmNlRGlyZWN0ZWQucHJvdG90eXBlLmVhY2hOb2RlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHR2YXIgdCA9IHRoaXM7XG5cdFx0dGhpcy5ncmFwaC5ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uKG4pe1xuXHRcdFx0Y2FsbGJhY2suY2FsbCh0LCBuLCB0LnBvaW50KG4pKTtcblx0XHR9KTtcblx0fTtcblxuXHQvLyBjYWxsYmFjayBzaG91bGQgYWNjZXB0IHR3byBhcmd1bWVudHM6IEVkZ2UsIFNwcmluZ1xuXHRMYXlvdXQuRm9yY2VEaXJlY3RlZC5wcm90b3R5cGUuZWFjaEVkZ2UgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXHRcdHZhciB0ID0gdGhpcztcblx0XHR0aGlzLmdyYXBoLmVkZ2VzLmZvckVhY2goZnVuY3Rpb24oZSl7XG5cdFx0XHRjYWxsYmFjay5jYWxsKHQsIGUsIHQuc3ByaW5nKGUpKTtcblx0XHR9KTtcblx0fTtcblxuXHQvLyBjYWxsYmFjayBzaG91bGQgYWNjZXB0IG9uZSBhcmd1bWVudDogU3ByaW5nXG5cdExheW91dC5Gb3JjZURpcmVjdGVkLnByb3RvdHlwZS5lYWNoU3ByaW5nID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHR2YXIgdCA9IHRoaXM7XG5cdFx0dGhpcy5ncmFwaC5lZGdlcy5mb3JFYWNoKGZ1bmN0aW9uKGUpe1xuXHRcdFx0Y2FsbGJhY2suY2FsbCh0LCB0LnNwcmluZyhlKSk7XG5cdFx0fSk7XG5cdH07XG5cblxuXHQvLyBQaHlzaWNzIHN0dWZmXG5cdExheW91dC5Gb3JjZURpcmVjdGVkLnByb3RvdHlwZS5hcHBseUNvdWxvbWJzTGF3ID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5lYWNoTm9kZShmdW5jdGlvbihuMSwgcG9pbnQxKSB7XG5cdFx0XHR0aGlzLmVhY2hOb2RlKGZ1bmN0aW9uKG4yLCBwb2ludDIpIHtcblx0XHRcdFx0aWYgKHBvaW50MSAhPT0gcG9pbnQyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dmFyIGQgPSBwb2ludDEucC5zdWJ0cmFjdChwb2ludDIucCk7XG5cdFx0XHRcdFx0dmFyIGRpc3RhbmNlID0gZC5tYWduaXR1ZGUoKSArIDAuMTsgLy8gYXZvaWQgbWFzc2l2ZSBmb3JjZXMgYXQgc21hbGwgZGlzdGFuY2VzIChhbmQgZGl2aWRlIGJ5IHplcm8pXG5cdFx0XHRcdFx0dmFyIGRpcmVjdGlvbiA9IGQubm9ybWFsaXNlKCk7XG5cblx0XHRcdFx0XHQvLyBhcHBseSBmb3JjZSB0byBlYWNoIGVuZCBwb2ludFxuXHRcdFx0XHRcdHBvaW50MS5hcHBseUZvcmNlKGRpcmVjdGlvbi5tdWx0aXBseSh0aGlzLnJlcHVsc2lvbikuZGl2aWRlKGRpc3RhbmNlICogZGlzdGFuY2UgKiAwLjUpKTtcblx0XHRcdFx0XHRwb2ludDIuYXBwbHlGb3JjZShkaXJlY3Rpb24ubXVsdGlwbHkodGhpcy5yZXB1bHNpb24pLmRpdmlkZShkaXN0YW5jZSAqIGRpc3RhbmNlICogLTAuNSkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fTtcblxuXHRMYXlvdXQuRm9yY2VEaXJlY3RlZC5wcm90b3R5cGUuYXBwbHlIb29rZXNMYXcgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVhY2hTcHJpbmcoZnVuY3Rpb24oc3ByaW5nKXtcblx0XHRcdHZhciBkID0gc3ByaW5nLnBvaW50Mi5wLnN1YnRyYWN0KHNwcmluZy5wb2ludDEucCk7IC8vIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHNwcmluZ1xuXHRcdFx0dmFyIGRpc3BsYWNlbWVudCA9IHNwcmluZy5sZW5ndGggLSBkLm1hZ25pdHVkZSgpO1xuXHRcdFx0dmFyIGRpcmVjdGlvbiA9IGQubm9ybWFsaXNlKCk7XG5cblx0XHRcdC8vIGFwcGx5IGZvcmNlIHRvIGVhY2ggZW5kIHBvaW50XG5cdFx0XHRzcHJpbmcucG9pbnQxLmFwcGx5Rm9yY2UoZGlyZWN0aW9uLm11bHRpcGx5KHNwcmluZy5rICogZGlzcGxhY2VtZW50ICogLTAuNSkpO1xuXHRcdFx0c3ByaW5nLnBvaW50Mi5hcHBseUZvcmNlKGRpcmVjdGlvbi5tdWx0aXBseShzcHJpbmcuayAqIGRpc3BsYWNlbWVudCAqIDAuNSkpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdExheW91dC5Gb3JjZURpcmVjdGVkLnByb3RvdHlwZS5hdHRyYWN0VG9DZW50cmUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmVhY2hOb2RlKGZ1bmN0aW9uKG5vZGUsIHBvaW50KSB7XG5cdFx0XHR2YXIgZGlyZWN0aW9uID0gcG9pbnQucC5tdWx0aXBseSgtMS4wKTtcblx0XHRcdHBvaW50LmFwcGx5Rm9yY2UoZGlyZWN0aW9uLm11bHRpcGx5KHRoaXMucmVwdWxzaW9uIC8gNTAuMCkpO1xuXHRcdH0pO1xuXHR9O1xuXG5cblx0TGF5b3V0LkZvcmNlRGlyZWN0ZWQucHJvdG90eXBlLnVwZGF0ZVZlbG9jaXR5ID0gZnVuY3Rpb24odGltZXN0ZXApIHtcblx0XHR0aGlzLmVhY2hOb2RlKGZ1bmN0aW9uKG5vZGUsIHBvaW50KSB7XG5cdFx0XHQvLyBJcyB0aGlzLCBhbG9uZyB3aXRoIHVwZGF0ZVBvc2l0aW9uIGJlbG93LCB0aGUgb25seSBwbGFjZXMgdGhhdCB5b3VyXG5cdFx0XHQvLyBpbnRlZ3JhdGlvbiBjb2RlIGV4aXN0P1xuXHRcdFx0cG9pbnQudiA9IHBvaW50LnYuYWRkKHBvaW50LmEubXVsdGlwbHkodGltZXN0ZXApKS5tdWx0aXBseSh0aGlzLmRhbXBpbmcpO1xuXHRcdFx0cG9pbnQuYSA9IG5ldyBWZWN0b3IoMCwwKTtcblx0XHR9KTtcblx0fTtcblxuXHRMYXlvdXQuRm9yY2VEaXJlY3RlZC5wcm90b3R5cGUudXBkYXRlUG9zaXRpb24gPSBmdW5jdGlvbih0aW1lc3RlcCkge1xuXHRcdHRoaXMuZWFjaE5vZGUoZnVuY3Rpb24obm9kZSwgcG9pbnQpIHtcblx0XHRcdC8vIFNhbWUgcXVlc3Rpb24gYXMgYWJvdmU7IGFsb25nIHdpdGggdXBkYXRlVmVsb2NpdHksIGlzIHRoaXMgYWxsIG9mXG5cdFx0XHQvLyB5b3VyIGludGVncmF0aW9uIGNvZGU/XG5cdFx0XHRwb2ludC5wID0gcG9pbnQucC5hZGQocG9pbnQudi5tdWx0aXBseSh0aW1lc3RlcCkpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdC8vIENhbGN1bGF0ZSB0aGUgdG90YWwga2luZXRpYyBlbmVyZ3kgb2YgdGhlIHN5c3RlbVxuXHRMYXlvdXQuRm9yY2VEaXJlY3RlZC5wcm90b3R5cGUudG90YWxFbmVyZ3kgPSBmdW5jdGlvbih0aW1lc3RlcCkge1xuXHRcdHZhciBlbmVyZ3kgPSAwLjA7XG5cdFx0dGhpcy5lYWNoTm9kZShmdW5jdGlvbihub2RlLCBwb2ludCkge1xuXHRcdFx0dmFyIHNwZWVkID0gcG9pbnQudi5tYWduaXR1ZGUoKTtcblx0XHRcdGVuZXJneSArPSAwLjUgKiBwb2ludC5tICogc3BlZWQgKiBzcGVlZDtcblx0XHR9KTtcblxuXHRcdHJldHVybiBlbmVyZ3k7XG5cdH07XG5cblx0dmFyIF9fYmluZCA9IGZ1bmN0aW9uKGZuLCBtZSl7IHJldHVybiBmdW5jdGlvbigpeyByZXR1cm4gZm4uYXBwbHkobWUsIGFyZ3VtZW50cyk7IH07IH07IC8vIHN0b2xlbiBmcm9tIGNvZmZlZXNjcmlwdCwgdGhhbmtzIGphc2hrZW5hcyEgOy0pXG5cblx0U3ByaW5neS5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBfX2JpbmQodGhpcy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHR0aGlzLndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuXHRcdHRoaXMubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG5cdFx0dGhpcy5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG5cdFx0dGhpcy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuXHRcdChmdW5jdGlvbihjYWxsYmFjaywgZWxlbWVudCkge1xuXHRcdFx0dGhpcy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMCk7XG5cdFx0fSksIHRoaXMpO1xuXG5cblx0LyoqXG5cdCAqIFN0YXJ0IHNpbXVsYXRpb24gaWYgaXQncyBub3QgcnVubmluZyBhbHJlYWR5LlxuXHQgKiBJbiBjYXNlIGl0J3MgcnVubmluZyB0aGVuIHRoZSBjYWxsIGlzIGlnbm9yZWQsIGFuZCBub25lIG9mIHRoZSBjYWxsYmFja3MgcGFzc2VkIGlzIGV2ZXIgZXhlY3V0ZWQuXG5cdCAqL1xuXHRMYXlvdXQuRm9yY2VEaXJlY3RlZC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbihyZW5kZXIsIG9uUmVuZGVyU3RvcCwgb25SZW5kZXJTdGFydCkge1xuXHRcdHZhciB0ID0gdGhpcztcblxuXHRcdGlmICh0aGlzLl9zdGFydGVkKSByZXR1cm47XG5cdFx0dGhpcy5fc3RhcnRlZCA9IHRydWU7XG5cdFx0dGhpcy5fc3RvcCA9IGZhbHNlO1xuXG5cdFx0aWYgKG9uUmVuZGVyU3RhcnQgIT09IHVuZGVmaW5lZCkgeyBvblJlbmRlclN0YXJ0KCk7IH1cblxuXHRcdFNwcmluZ3kucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uIHN0ZXAoKSB7XG5cdFx0XHR0LnRpY2soMC4wMyk7XG5cblx0XHRcdGlmIChyZW5kZXIgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZW5kZXIoKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gc3RvcCBzaW11bGF0aW9uIHdoZW4gZW5lcmd5IG9mIHRoZSBzeXN0ZW0gZ29lcyBiZWxvdyBhIHRocmVzaG9sZFxuXHRcdFx0aWYgKHQuX3N0b3AgfHwgdC50b3RhbEVuZXJneSgpIDwgdC5taW5FbmVyZ3lUaHJlc2hvbGQpIHtcblx0XHRcdFx0dC5fc3RhcnRlZCA9IGZhbHNlO1xuXHRcdFx0XHRpZiAob25SZW5kZXJTdG9wICE9PSB1bmRlZmluZWQpIHsgb25SZW5kZXJTdG9wKCk7IH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFNwcmluZ3kucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHN0ZXApO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xuXG5cdExheW91dC5Gb3JjZURpcmVjdGVkLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fc3RvcCA9IHRydWU7XG5cdH1cblxuXHRMYXlvdXQuRm9yY2VEaXJlY3RlZC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKHRpbWVzdGVwKSB7XG5cdFx0dGhpcy5hcHBseUNvdWxvbWJzTGF3KCk7XG5cdFx0dGhpcy5hcHBseUhvb2tlc0xhdygpO1xuXHRcdHRoaXMuYXR0cmFjdFRvQ2VudHJlKCk7XG5cdFx0dGhpcy51cGRhdGVWZWxvY2l0eSh0aW1lc3RlcCk7XG5cdFx0dGhpcy51cGRhdGVQb3NpdGlvbih0aW1lc3RlcCk7XG5cdH07XG5cblx0Ly8gRmluZCB0aGUgbmVhcmVzdCBwb2ludCB0byBhIHBhcnRpY3VsYXIgcG9zaXRpb25cblx0TGF5b3V0LkZvcmNlRGlyZWN0ZWQucHJvdG90eXBlLm5lYXJlc3QgPSBmdW5jdGlvbihwb3MpIHtcblx0XHR2YXIgbWluID0ge25vZGU6IG51bGwsIHBvaW50OiBudWxsLCBkaXN0YW5jZTogbnVsbH07XG5cdFx0dmFyIHQgPSB0aGlzO1xuXHRcdHRoaXMuZ3JhcGgubm9kZXMuZm9yRWFjaChmdW5jdGlvbihuKXtcblx0XHRcdHZhciBwb2ludCA9IHQucG9pbnQobik7XG5cdFx0XHR2YXIgZGlzdGFuY2UgPSBwb2ludC5wLnN1YnRyYWN0KHBvcykubWFnbml0dWRlKCk7XG5cblx0XHRcdGlmIChtaW4uZGlzdGFuY2UgPT09IG51bGwgfHwgZGlzdGFuY2UgPCBtaW4uZGlzdGFuY2UpIHtcblx0XHRcdFx0bWluID0ge25vZGU6IG4sIHBvaW50OiBwb2ludCwgZGlzdGFuY2U6IGRpc3RhbmNlfTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiBtaW47XG5cdH07XG5cblx0Ly8gcmV0dXJucyBbYm90dG9tbGVmdCwgdG9wcmlnaHRdXG5cdExheW91dC5Gb3JjZURpcmVjdGVkLnByb3RvdHlwZS5nZXRCb3VuZGluZ0JveCA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBib3R0b21sZWZ0ID0gbmV3IFZlY3RvcigtMiwtMik7XG5cdFx0dmFyIHRvcHJpZ2h0ID0gbmV3IFZlY3RvcigyLDIpO1xuXG5cdFx0dGhpcy5lYWNoTm9kZShmdW5jdGlvbihuLCBwb2ludCkge1xuXHRcdFx0aWYgKHBvaW50LnAueCA8IGJvdHRvbWxlZnQueCkge1xuXHRcdFx0XHRib3R0b21sZWZ0LnggPSBwb2ludC5wLng7XG5cdFx0XHR9XG5cdFx0XHRpZiAocG9pbnQucC55IDwgYm90dG9tbGVmdC55KSB7XG5cdFx0XHRcdGJvdHRvbWxlZnQueSA9IHBvaW50LnAueTtcblx0XHRcdH1cblx0XHRcdGlmIChwb2ludC5wLnggPiB0b3ByaWdodC54KSB7XG5cdFx0XHRcdHRvcHJpZ2h0LnggPSBwb2ludC5wLng7XG5cdFx0XHR9XG5cdFx0XHRpZiAocG9pbnQucC55ID4gdG9wcmlnaHQueSkge1xuXHRcdFx0XHR0b3ByaWdodC55ID0gcG9pbnQucC55O1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dmFyIHBhZGRpbmcgPSB0b3ByaWdodC5zdWJ0cmFjdChib3R0b21sZWZ0KS5tdWx0aXBseSgwLjA3KTsgLy8gfjUlIHBhZGRpbmdcblxuXHRcdHJldHVybiB7Ym90dG9tbGVmdDogYm90dG9tbGVmdC5zdWJ0cmFjdChwYWRkaW5nKSwgdG9wcmlnaHQ6IHRvcHJpZ2h0LmFkZChwYWRkaW5nKX07XG5cdH07XG5cblxuXHQvLyBWZWN0b3Jcblx0dmFyIFZlY3RvciA9IFNwcmluZ3kuVmVjdG9yID0gZnVuY3Rpb24oeCwgeSkge1xuXHRcdHRoaXMueCA9IHg7XG5cdFx0dGhpcy55ID0geTtcblx0fTtcblxuXHRWZWN0b3IucmFuZG9tID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIG5ldyBWZWN0b3IoMTAuMCAqIChNYXRoLnJhbmRvbSgpIC0gMC41KSwgMTAuMCAqIChNYXRoLnJhbmRvbSgpIC0gMC41KSk7XG5cdH07XG5cblx0VmVjdG9yLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih2Mikge1xuXHRcdHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCArIHYyLngsIHRoaXMueSArIHYyLnkpO1xuXHR9O1xuXG5cdFZlY3Rvci5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbih2Mikge1xuXHRcdHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCAtIHYyLngsIHRoaXMueSAtIHYyLnkpO1xuXHR9O1xuXG5cdFZlY3Rvci5wcm90b3R5cGUubXVsdGlwbHkgPSBmdW5jdGlvbihuKSB7XG5cdFx0cmV0dXJuIG5ldyBWZWN0b3IodGhpcy54ICogbiwgdGhpcy55ICogbik7XG5cdH07XG5cblx0VmVjdG9yLnByb3RvdHlwZS5kaXZpZGUgPSBmdW5jdGlvbihuKSB7XG5cdFx0cmV0dXJuIG5ldyBWZWN0b3IoKHRoaXMueCAvIG4pIHx8IDAsICh0aGlzLnkgLyBuKSB8fCAwKTsgLy8gQXZvaWQgZGl2aWRlIGJ5IHplcm8gZXJyb3JzLi5cblx0fTtcblxuXHRWZWN0b3IucHJvdG90eXBlLm1hZ25pdHVkZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBNYXRoLnNxcnQodGhpcy54KnRoaXMueCArIHRoaXMueSp0aGlzLnkpO1xuXHR9O1xuXG5cdFZlY3Rvci5wcm90b3R5cGUubm9ybWFsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIG5ldyBWZWN0b3IoLXRoaXMueSwgdGhpcy54KTtcblx0fTtcblxuXHRWZWN0b3IucHJvdG90eXBlLm5vcm1hbGlzZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmRpdmlkZSh0aGlzLm1hZ25pdHVkZSgpKTtcblx0fTtcblxuXHQvLyBQb2ludFxuXHRMYXlvdXQuRm9yY2VEaXJlY3RlZC5Qb2ludCA9IGZ1bmN0aW9uKHBvc2l0aW9uLCBtYXNzKSB7XG5cdFx0dGhpcy5wID0gcG9zaXRpb247IC8vIHBvc2l0aW9uXG5cdFx0dGhpcy5tID0gbWFzczsgLy8gbWFzc1xuXHRcdHRoaXMudiA9IG5ldyBWZWN0b3IoMCwgMCk7IC8vIHZlbG9jaXR5XG5cdFx0dGhpcy5hID0gbmV3IFZlY3RvcigwLCAwKTsgLy8gYWNjZWxlcmF0aW9uXG5cdH07XG5cblx0TGF5b3V0LkZvcmNlRGlyZWN0ZWQuUG9pbnQucHJvdG90eXBlLmFwcGx5Rm9yY2UgPSBmdW5jdGlvbihmb3JjZSkge1xuXHRcdHRoaXMuYSA9IHRoaXMuYS5hZGQoZm9yY2UuZGl2aWRlKHRoaXMubSkpO1xuXHR9O1xuXG5cdC8vIFNwcmluZ1xuXHRMYXlvdXQuRm9yY2VEaXJlY3RlZC5TcHJpbmcgPSBmdW5jdGlvbihwb2ludDEsIHBvaW50MiwgbGVuZ3RoLCBrKSB7XG5cdFx0dGhpcy5wb2ludDEgPSBwb2ludDE7XG5cdFx0dGhpcy5wb2ludDIgPSBwb2ludDI7XG5cdFx0dGhpcy5sZW5ndGggPSBsZW5ndGg7IC8vIHNwcmluZyBsZW5ndGggYXQgcmVzdFxuXHRcdHRoaXMuayA9IGs7IC8vIHNwcmluZyBjb25zdGFudCAoU2VlIEhvb2tlJ3MgbGF3KSAuLiBob3cgc3RpZmYgdGhlIHNwcmluZyBpc1xuXHR9O1xuXG5cdC8vIExheW91dC5Gb3JjZURpcmVjdGVkLlNwcmluZy5wcm90b3R5cGUuZGlzdGFuY2VUb1BvaW50ID0gZnVuY3Rpb24ocG9pbnQpXG5cdC8vIHtcblx0Ly8gXHQvLyBoYXJkY29yZSB2ZWN0b3IgYXJpdGhtZXRpYy4uIG9oaCB5ZWFoIVxuXHQvLyBcdC8vIC4uIHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzg0OTIxMS9zaG9ydGVzdC1kaXN0YW5jZS1iZXR3ZWVuLWEtcG9pbnQtYW5kLWEtbGluZS1zZWdtZW50Lzg2NTA4MCM4NjUwODBcblx0Ly8gXHR2YXIgbiA9IHRoaXMucG9pbnQyLnAuc3VidHJhY3QodGhpcy5wb2ludDEucCkubm9ybWFsaXNlKCkubm9ybWFsKCk7XG5cdC8vIFx0dmFyIGFjID0gcG9pbnQucC5zdWJ0cmFjdCh0aGlzLnBvaW50MS5wKTtcblx0Ly8gXHRyZXR1cm4gTWF0aC5hYnMoYWMueCAqIG4ueCArIGFjLnkgKiBuLnkpO1xuXHQvLyB9O1xuXG5cdC8qKlxuXHQgKiBSZW5kZXJlciBoYW5kbGVzIHRoZSBsYXlvdXQgcmVuZGVyaW5nIGxvb3Bcblx0ICogQHBhcmFtIG9uUmVuZGVyU3RvcCBvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hlbmV2ZXIgcmVuZGVyaW5nIHN0b3BzLlxuXHQgKiBAcGFyYW0gb25SZW5kZXJTdGFydCBvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGdldHMgZXhlY3V0ZWQgd2hlbmV2ZXIgcmVuZGVyaW5nIHN0YXJ0cy5cblx0ICovXG5cdHZhciBSZW5kZXJlciA9IFNwcmluZ3kuUmVuZGVyZXIgPSBmdW5jdGlvbihsYXlvdXQsIGNsZWFyLCBkcmF3RWRnZSwgZHJhd05vZGUsIG9uUmVuZGVyU3RvcCwgb25SZW5kZXJTdGFydCkge1xuXHRcdHRoaXMubGF5b3V0ID0gbGF5b3V0O1xuXHRcdHRoaXMuY2xlYXIgPSBjbGVhcjtcblx0XHR0aGlzLmRyYXdFZGdlID0gZHJhd0VkZ2U7XG5cdFx0dGhpcy5kcmF3Tm9kZSA9IGRyYXdOb2RlO1xuXHRcdHRoaXMub25SZW5kZXJTdG9wID0gb25SZW5kZXJTdG9wO1xuXHRcdHRoaXMub25SZW5kZXJTdGFydCA9IG9uUmVuZGVyU3RhcnQ7XG5cblx0XHR0aGlzLmxheW91dC5ncmFwaC5hZGRHcmFwaExpc3RlbmVyKHRoaXMpO1xuXHR9XG5cblx0UmVuZGVyZXIucHJvdG90eXBlLmdyYXBoQ2hhbmdlZCA9IGZ1bmN0aW9uKGUpIHtcblx0XHR0aGlzLnN0YXJ0KCk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFN0YXJ0cyB0aGUgc2ltdWxhdGlvbiBvZiB0aGUgbGF5b3V0IGluIHVzZS5cblx0ICpcblx0ICogTm90ZSB0aGF0IGluIGNhc2UgdGhlIGFsZ29yaXRobSBpcyBzdGlsbCBvciBhbHJlYWR5IHJ1bm5pbmcgdGhlbiB0aGUgbGF5b3V0IHRoYXQncyBpbiB1c2Vcblx0ICogbWlnaHQgc2lsZW50bHkgaWdub3JlIHRoZSBjYWxsLCBhbmQgeW91ciBvcHRpb25hbCA8Y29kZT5kb25lPC9jb2RlPiBjYWxsYmFjayBpcyBuZXZlciBleGVjdXRlZC5cblx0ICogQXQgbGVhc3QgdGhlIGJ1aWx0LWluIEZvcmNlRGlyZWN0ZWQgbGF5b3V0IGJlaGF2ZXMgaW4gdGhpcyB3YXkuXG5cdCAqXG5cdCAqIEBwYXJhbSBkb25lIEFuIG9wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIHRoYXQgZ2V0cyBleGVjdXRlZCB3aGVuIHRoZSBzcHJpbmd5IGFsZ29yaXRobSBzdG9wcyxcblx0ICogZWl0aGVyIGJlY2F1c2UgaXQgZW5kZWQgb3IgYmVjYXVzZSBzdG9wKCkgd2FzIGNhbGxlZC5cblx0ICovXG5cdFJlbmRlcmVyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKGRvbmUpIHtcblx0XHR2YXIgdCA9IHRoaXM7XG5cdFx0dGhpcy5sYXlvdXQuc3RhcnQoZnVuY3Rpb24gcmVuZGVyKCkge1xuXHRcdFx0dC5jbGVhcigpO1xuXG5cdFx0XHR0LmxheW91dC5lYWNoRWRnZShmdW5jdGlvbihlZGdlLCBzcHJpbmcpIHtcblx0XHRcdFx0dC5kcmF3RWRnZShlZGdlLCBzcHJpbmcucG9pbnQxLnAsIHNwcmluZy5wb2ludDIucCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0dC5sYXlvdXQuZWFjaE5vZGUoZnVuY3Rpb24obm9kZSwgcG9pbnQpIHtcblx0XHRcdFx0dC5kcmF3Tm9kZShub2RlLCBwb2ludC5wKTtcblx0XHRcdH0pO1xuXHRcdH0sIHRoaXMub25SZW5kZXJTdG9wLCB0aGlzLm9uUmVuZGVyU3RhcnQpO1xuXHR9O1xuXG5cdFJlbmRlcmVyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5sYXlvdXQuc3RvcCgpO1xuXHR9O1xuXG5cdC8vIEFycmF5LmZvckVhY2ggaW1wbGVtZW50YXRpb24gZm9yIElFIHN1cHBvcnQuLlxuXHQvL2h0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZvckVhY2hcblx0aWYgKCAhQXJyYXkucHJvdG90eXBlLmZvckVhY2ggKSB7XG5cdFx0QXJyYXkucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiggY2FsbGJhY2ssIHRoaXNBcmcgKSB7XG5cdFx0XHR2YXIgVCwgaztcblx0XHRcdGlmICggdGhpcyA9PSBudWxsICkge1xuXHRcdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCBcIiB0aGlzIGlzIG51bGwgb3Igbm90IGRlZmluZWRcIiApO1xuXHRcdFx0fVxuXHRcdFx0dmFyIE8gPSBPYmplY3QodGhpcyk7XG5cdFx0XHR2YXIgbGVuID0gTy5sZW5ndGggPj4+IDA7IC8vIEhhY2sgdG8gY29udmVydCBPLmxlbmd0aCB0byBhIFVJbnQzMlxuXHRcdFx0aWYgKCB7fS50b1N0cmluZy5jYWxsKGNhbGxiYWNrKSAhPSBcIltvYmplY3QgRnVuY3Rpb25dXCIgKSB7XG5cdFx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoIGNhbGxiYWNrICsgXCIgaXMgbm90IGEgZnVuY3Rpb25cIiApO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCB0aGlzQXJnICkge1xuXHRcdFx0XHRUID0gdGhpc0FyZztcblx0XHRcdH1cblx0XHRcdGsgPSAwO1xuXHRcdFx0d2hpbGUoIGsgPCBsZW4gKSB7XG5cdFx0XHRcdHZhciBrVmFsdWU7XG5cdFx0XHRcdGlmICggayBpbiBPICkge1xuXHRcdFx0XHRcdGtWYWx1ZSA9IE9bIGsgXTtcblx0XHRcdFx0XHRjYWxsYmFjay5jYWxsKCBULCBrVmFsdWUsIGssIE8gKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRrKys7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuXG5cdHZhciBpc0VtcHR5ID0gZnVuY3Rpb24ob2JqKSB7XG5cdFx0Zm9yICh2YXIgayBpbiBvYmopIHtcblx0XHRcdGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuICByZXR1cm4gU3ByaW5neTtcbn0pKTtcbiIsImltcG9ydCBzcHJpbmd5IGZyb20gJ3NwcmluZ3knO1xuXG5jb25zb2xlLmxvZyhzcHJpbmd5KTtcbiJdfQ==
