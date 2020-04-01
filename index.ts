type ID = number | string;
const DEPTH_LIMIT = 100;
export class TaskIndex {
	items = {};
	itemIds = {};
	topLevel = [];
	tree = [];
	defaultFilter = (task: Task)=>true;

	constructor(tree) {
		this.prepareIndexState(tree);
	}

	private prepareIndexState(tree) {
		this.tree = tree;
		const items = {};
		const itemIds = {};
		tree.forEach((node) => {
			itemIds[node.id] = new IndexFrame();items[node.id] = node;
		});
		this.itemIds=itemIds;
		this.items=items;
		const childMappings = tree
			.map(item => item.children)
			.reduce((all, current) => all.concat(current));
		const topLevel = tree
			.filter(item => childMappings.indexOf(item.id) === -1)
			.map(item => item.id);
		this.topLevel = topLevel;
	}

	parentDirect(id: ID): ID {
		const parent = this.tree
			.filter(item => item.children.indexOf(id) > -1)
			.map(item => item.id);
		if (parent.length > 0) {
			return parent[0];
		}
		return -1;
	}

	parents(id: ID): ID[] {
		const parents = [];
		let parent;
		let target = id;
		let attempt = 0;
		while(attempt < DEPTH_LIMIT) {
			attempt++;
			parent = this.tree
				.filter(item => item.children.indexOf(target) > -1)
				.map(item => item.id);

			if(parent.length > 0 && parent[0] > -1) {
				parents.push(parent[0])
				target = parent[0];
			} else {
				break;
			}
			if(attempt >= DEPTH_LIMIT) {
				throw new Error(`Tree is too deep. Limit is ${DEPTH_LIMIT}`);
			}
		}
		return parents;
	}

	childrenDirect(id: ID): ID[] {
		const task = this.items[id];
		if(task) {
			return task.children;
		}
		throw new Error(`No item found with id: ${id}`);
	}

	children(id): ID[] {
		let count = 0;
		let currentGen = [id];
		let total = [];
		while (count < DEPTH_LIMIT) {
			count ++;
			const nextGen = currentGen
				.map(childId => this.items[childId] ? this.items[childId].children : [])
				.reduce((flat, childArray) => flat.concat(childArray),[]);
			if (nextGen.length < 1) {
				break
			}
			total = total.concat(nextGen);
			currentGen = nextGen;
		}
		return total;
	}

	siblings(id): ID[] {
		const siblings = this.tree
			.filter(item => item.children.indexOf(id) > -1)
			.map(item => item.children)
			.reduce((flat, current)=> flat.concat(current),[]);
		return Array.from(new Set(siblings));
	}

	siblingsOnly(id): ID[] {
		const siblings = this.tree
			.filter(item => item.children.indexOf(id) > -1)
			.map(item => item.children)
			.reduce((flat, current)=> flat.concat(current),[])
			.filter(item => item !== id);
		return Array.from(new Set(siblings));
	}	

	private _next(itemIds, filters=this.defaultFilter) {
		let found = [];
		for(let top of itemIds) {
			const item = this.items[top];
			let childrenFound = [];
			if(item.children && item.children.length) {
				childrenFound = this._next(item.children);
				found = found.concat(childrenFound);
			}
			if(filters(item)) {
				found.push(top);
			}
		}
		return found;
	}

	next() {
		return this._next(this.topLevel).map(idNumber => this.items[idNumber]);
	}
}

export class IndexFrame {
	constructor() {
	}
}

export class Task {
	constructor(public id, public text, public children=[]) {}
}

export function taskMatches(logic) {
	return (task: Task) => logic(task);
}
export function taskChildMatches(task: Task) {}
export function taskParentMatches(task: Task) {}
