class Food {
	constructor (x, y) {
		this.index = Food.push(this)

		this.x = x
		this.y = y
		this.size = 10
		this.color = 'orange'

		this.chunkX = Math.floor(this.x / TILE_SIZE)
		this.chunkY = Math.floor(this.y / TILE_SIZE)

		Food.addToChunk(this.chunkX, this.chunkY, this.index)
	}

	getEaten () {
		Food.removeFromChunk(this.chunkX, this.chunkY, this.index)
		Food.remove(this)
		delete this
		Food.newRandom()
	}

	draw (ctx) {
		ctx.save()
		ctx.translate(this.x, this.y)
		ctx.fillStyle = this.color
		ctx.beginPath()
		ctx.arc(0, 0, this.size, 0, V_360_DEG)
		ctx.fill()
		ctx.restore()
	}

	process () {}

	static newRandom () {
		this.get_n_random(1)
	}

	static get_n_random(n) {
		for (let i = 0; i < n; i++) {
			let x = Math.random() * CANVAS_SIZE
			let y = Math.random() * CANVAS_SIZE
			new Food(x, y)
		}
	}

	static process() {
		for (let c of this.foods) c.process()
	}

	static draw(ctx) {
		for (let c of this.foods) c.draw(ctx)
	}
	
	static get foods () {
		return Object.values(this._foods)
	}

	static push(food) {
		if (typeof this.foodCount == 'undefined') this.foodCount = 0
		if (typeof this._foods == 'undefined') this._foods = {}
		this._foods[this.foodCount] = food
		return this.foodCount ++
	}

	static remove(food) {
		delete this._foods[food.index]
	}

	static checkChunk(x, y) {
		if (typeof this.chunks == 'undefined') this.chunks = {}
		if (typeof this.chunks[x] == 'undefined') this.chunks[x] = {}
		if (typeof this.chunks[x][y] == 'undefined') this.chunks[x][y] = []
	}

	static removeFromChunk(x, y, foodIndex) {
		this.checkChunk(x, y)
		let index = this.chunks[x][y].indexOf(foodIndex)
		this.chunks[x][y].splice(index, 1)
	}

	static addToChunk(x, y, index) {
		this.checkChunk(x, y)
		this.chunks[x][y].push(index)
	}

	static foodsNearByChunk (a, b, n = 1) {
		let foods = []
		for (let x = -n; x <= n; x ++) {
			for (let y = -n; y <= n; y ++) {
				this.checkChunk(a + x, b + y)

				for (let index of this.chunks[a+x][b+y]) {
					if (typeof this._foods[index] != 'undefined') foods.push(this._foods[index])
				}
			}
		}
		return foods
	}
}