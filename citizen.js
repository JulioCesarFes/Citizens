class Citizen {
	constructor (x, y) {
		this.index = Citizen.push(this)

		this.x = x
		this.y = y
		this.a = 0

		this.v = 5

		this.hue = Math.random() * 360
		this.color = `hsl(${ this.hue }, 40%, 60%)`
		this.saturation = 40
		this.lightness = 60

		this.size = 30
		this.pointer_size = this.size * 1.4

		this.unsetPin()

		this.debbug = false // <--
		this.highlight = false

		this.breathing = true
		this.breath_min = 1
		this.breath_max = 1.1
		this.breath_vel = 0.01
		this.breath = this.breath_min
		this.inhale = true

		this.sleeping = false
		this.sleepingTimer = 0

		this.thought = 0

		this.boundaries = false
		this.calcChunk()

		this.following = false

		this.energy = 300
		this.storedEnergy = 5

		this.chaseFood = false

		this.fainted = false
		this.faintCountDown = 100

		this.rescue = false
	}

	setBoundaries(x1, y1, x2, y2) {
		this.boundaries = [[x1, x2], [y1, y2]]
	}

	setPin (pin) {
		if (this.following) return
		if (this.sleeping) return
		this.pin = pin
	}

	unsetPin () {
		this.pin = false
	}

	sleep () {
		if (this.fainted) return
		this.sleeping = true
		this.breath_max = 1.2
		this.breath_vel = 0.005
	}

	wakeUp () {
		this.sleeping = false
		this.fainted = false
		this.breath_max = 1.03
		this.breath_vel = 0.01
		this.saturation = 40

		Citizen.removeFainted(this)
	}

	faint () {
		this.sleeping = true
		this.fainted = true
		this.faintCountDown = 100
		this.breath_max = 1.3
		this.breath_vel = 0.005
		this.saturation = 10

		Citizen.pushFainted(this)
	}

	die () {
		this.sleep()
		this.breathing = false
		Citizen.removeFromChunk(this.chunkX, this.chunkY, this.index)
	}

	spendEnergy() {
		this.energy -= 1

		if (this.energy <= 0) {
			this.energy = 0
			this.breathing = false
			this.sleeping = true
		}
	}

	checkEnergyLevel () {
		if (!this.breathing) {
			if (this.size > 10) this.size -= 1
			if (this.lightness > 30) this.lightness -= 1
			this.color = `hsl(${ this.hue }, 40%, ${this.lightness}% )`
			return
		}

		if (this.sleeping) {
			if (this.sleepingTimer > 0) {
				this.sleepingTimer -= 1
				return

			} else {
				this.sleepingTimer = 0
				this.sleeping = false

				if (this.storedEnergy > 1) {
					this.storedEnergy -= 1
					this.energy += 100
				} else {
					this.faint()
				}
			}
		}

		if (this.energy <= 5) {
			this.sleeping = true
			this.sleepingTimer = 30
		}

		this.size = 10 + Math.log(this.storedEnergy)
		this.pointer_size = this.size * 1.4
	}

	process () {
		this.calcChunk()
		this.breathe()
		this.changeColor()
		this.checkEnergyLevel()

		if (!this.breathing) return

		if (this.sleeping) return

		this.searchFainted()
		this.searchFood()
		this.chosePath()
	}

	calcChunk () {
		let oldChunkX = this.chunkX
		let oldChunkY = this.chunkY
		this.chunkX = Math.floor(this.x / TILE_SIZE)
		this.chunkY = Math.floor(this.y / TILE_SIZE)

		Citizen.removeFromChunk(oldChunkX, oldChunkY, this.index)
		Citizen.addToChunk(this.chunkX, this.chunkY, this.index)
	}

	moveWithAngle (a, distance) {
		this.x += Math.cos(a) * distance
		this.y += Math.sin(a) * distance
		this.spendEnergy()
	}

	move () {
		this.moveWithAngle(this.a, this.v)
	}

	pushedFrom (a, distance) {
		this.moveWithAngle(a + V_180_DEG, distance)
	}

	rotateTo (a) {
		this.a = a
		this.spendEnergy()
	}

	addRotation (a) {
		this.rotateTo(this.a + a)
	}

	searchFainted () {
		let citizens = Citizen.fainted()

		if (!citizens.length) return

		let lastDistance
		let lastFainted

		for (let citizen of citizens) {
			if (citizen.index == this.index) continue

			let distance = this.distance(citizen.x, citizen.y)

			if (typeof lastDistance == 'undefined' || distance < lastDistance) {
				lastDistance = distance
				lastFainted = citizen
			}
		}

		this.rescue = lastFainted
	}

	searchFood () {
		if (this.chaseFood) return

		let n = Math.floor(this.storedEnergy / 5)

		let foods = Food.foodsNearByChunk(this.chunkX, this.chunkY, n)
		// if (this.highlight) console.log(foods)
		
		let closestFood
		let closestDistance

		for (let food of foods) {
			let d = this.distance(food.x, food.y)

			if (typeof closestDistance == 'undefined') {
				closestDistance = d
				closestFood = food
				continue
			}

			if (d < closestDistance) {
				closestDistance = d
				closestFood = food
			}
		}

		if (typeof closestFood != 'undefined') this.chaseFood = closestFood
	}

	foods () {
		return Food.foodsNearByChunk(this.chunkX, this.chunkY)
	}

	eatFood () {
		let food = this.chaseFood 
		this.chaseFood = false
		this.storedEnergy += 1
		food.getEaten()
	}

	chosePath () {
		let oldX = this.x
		let oldY = this.y

		if (this.pin) {
			let c1 = this.pin.x - this.x
			let c2 = this.pin.y - this.y
			let a = Math.atan2(c2, c1)
			this.rotateTo(a)

			let d = Math.abs(Math.sqrt(c1*c1 + c2*c2))
			if (d > this.size) this.move()

		} else if (this.chaseFood) {
			let c1 = this.chaseFood.x - this.x
			let c2 = this.chaseFood.y - this.y
			let a = Math.atan2(c2, c1)
			this.rotateTo(a)

			let d = Math.abs(Math.sqrt(c1*c1 + c2*c2))
			if (d > this.size) this.move()
			else this.eatFood()
			this.chaseFood = false

		} else if (this.following) {
			let c1 = this.following.x - this.x
			let c2 = this.following.y - this.y
			let a = Math.atan2(c2, c1)
			this.rotateTo(a)

			let d = Math.abs(Math.sqrt(c1*c1 + c2*c2))
			if (d > this.size) this.move()

		} else {

			let a = noise.simplex2(this.index, this.thought)
			let b = noise.simplex2(this.index + 0.5, this.thought)

			this.thought += 0.1

			// rotacionar para direita ou para a esquerda
			if (a > 0.5) this.addRotation(V_10_DEG)
			if (a < -0.5) this.addRotation(-V_10_DEG)
			
			// andar ou não
			if (b > 0) this.move()
		}

		if (this.boundaries) {
			let [[x1, x2], [y1, y2]] = this.boundaries

			x1 += this.size
			x2 -= this.size
			y1 += this.size
			y2 -= this.size

			if (this.x < x1) this.x = x1
			if (this.x > x2) this.x = x2 
			if (this.y < y1) this.y = y1
			if (this.y > y2) this.y = y2
		}

		let collision = false

		let citizens = Citizen.citizensNearByChunk(this.chunkX, this.chunkY)

		for (let citizen of citizens) {
			if (citizen.index == this.index) continue

			let d = this.distance(citizen.x, citizen.y)

			if (d < this.size + citizen.size) {
				let a = this.angle(citizen.x, citizen.y)
				this.pushedFrom(a, this.size + citizen.size - d)
			}
		}
	}

	distance (x, y) {
		let c1 = x - this.x
		let c2 = y - this.y
		return Math.abs(Math.sqrt(c1*c1 + c2*c2))
	}

	angle (x, y) {
		let c1 = x - this.x
		let c2 = y - this.y
		return Math.atan2(c2, c1)
	}

	breathe () {
		if (!this.breathing) {
			if (this.breath != this.breath_min) this.breath = this.breath_min
			return
		}

		if (this.fainted) {
			this.faintCountDown -= 1
			if (this.faintCountDown <= 0) {
				this.breathing = false
			}
		}

		if (this.inhale) {
			this.breath += this.breath_vel
			if (this.breath > this.breath_max) this.breath = this.breath_max
			if (this.breath == this.breath_max) this.inhale = false
		} else {
			this.breath -= this.breath_vel
			if (this.breath < this.breath_min) this.breath = this.breath_min
			if (this.breath == this.breath_min) this.inhale = true
		}
	}

	changeColor () {
		this.color = `hsl(${ this.hue }, ${ this.saturation }%, ${ mapper(this.breath, this.breath_min, this.breath_max, 50, 60) }%)`
	}

	draw (ctx) {
		ctx.save()
		ctx.translate(this.x, this.y)
		ctx.rotate(this.a)

		ctx.fillStyle = this.color

		if (!this.sleeping) {
			ctx.beginPath()
			ctx.moveTo(0, this.size)
			ctx.lineTo(this.pointer_size, 0)
			ctx.lineTo(0, -this.size)
			ctx.fill()
		}

		if (this.breathing) {
			ctx.scale(this.breath, this.breath)
		}

		ctx.beginPath()
		ctx.arc(0, 0, this.size, 0, V_360_DEG)
		ctx.fill()

		ctx.restore()
	}

	drawHighlight () {
		if (!this.highlight) return

		ctx.save()
		ctx.translate(this.x, this.y)
		ctx.rotate(this.a)

		ctx.strokeStyle = 'gold'
		ctx.lineWidth = 10

		if (!this.sleeping) {
			ctx.beginPath()
			ctx.moveTo(0, this.size)
			ctx.lineTo(this.pointer_size, 0)
			ctx.lineTo(0, -this.size)
			ctx.stroke()
		}

		if (this.breathing) {
			ctx.scale(this.breath, this.breath)
		}

		ctx.beginPath()
		ctx.arc(0, 0, this.size, 0, V_360_DEG)
		ctx.stroke()

		ctx.restore()

	}

	drawDebbug (ctx){
		if (!this.debbug) return

		if (this.pin) {
			ctx.save()
			ctx.strokeStyle = 'lime'

			ctx.beginPath()
			ctx.moveTo(this.pin.x, this.pin.y)
			ctx.lineTo(this.x, this.y)
			ctx.stroke()

			// ctx.beginPath()
			// ctx.moveTo(this.pin.x, this.pin.y)
			// ctx.lineTo(this.pin.x, this.y)
			// ctx.stroke()

			// ctx.beginPath()
			// ctx.moveTo(this.pin.x, this.y)
			// ctx.lineTo(this.x, this.y)
			// ctx.stroke()
			ctx.restore()
		}

		let n = Math.floor(this.storedEnergy / 5)
		ctx.save()
		ctx.strokeStyle = 'lime'
		// ctx.strokeRect(this.chunkX * TILE_SIZE, this.chunkY * TILE_SIZE, TILE_SIZE, TILE_SIZE)
		ctx.strokeRect((this.chunkX - n) * TILE_SIZE, (this.chunkY - n) * TILE_SIZE, TILE_SIZE * (n*2+1), TILE_SIZE * (n*2+1))
		ctx.restore()

		let citizens = Citizen.citizensNearByChunk(this.chunkX, this.chunkY)

		for (let citizen of citizens) {
			if (citizen.index == this.index) continue

			ctx.save()
			ctx.strokeStyle = 'blue'

			let d = this.distance(citizen.x, citizen.y)
			if (d < this.size * 2) {
				ctx.strokeStyle = 'orange'
			}

			ctx.lineWidth = 10
			ctx.beginPath()
			ctx.moveTo(citizen.x, citizen.y)
			ctx.lineTo(this.x, this.y)
			ctx.stroke()
			ctx.restore()
		}


		let foods = Food.foodsNearByChunk(this.chunkX, this.chunkY, n)

		for (let food of foods) {
			ctx.save()
			ctx.strokeStyle = 'blue'

			let d = this.distance(food.x, food.y)
			if (d < this.size * 2) {
				ctx.strokeStyle = 'orange'
			}

			ctx.lineWidth = 10
			ctx.beginPath()
			ctx.moveTo(food.x, food.y)
			ctx.lineTo(this.x, this.y)
			ctx.stroke()
			ctx.restore()
		}
	}


	static push(citizen) {
		if (typeof this.citizens == 'undefined') this.citizens = []
		this.citizens.push(citizen)
		return this.citizens.length -1
	}

	static get_n_random(n) {
		for (let i = 0; i < n; i++) {
			let x = Math.random() * CANVAS_SIZE
			let y = Math.random() * CANVAS_SIZE
			new Citizen(x, y)
		}
	}

	static setPin(pin) {
		for (let c of this.citizens) c.setPin(pin)
	}

	static unsetPin() {
		for (let c of this.citizens) c.unsetPin()
	}

	static process() {
		for (let c of this.citizens) c.process()
	}

	static setBoundaries(x1, y1, x2, y2) {
		for (let c of this.citizens) c.setBoundaries(x1, y1, x2, y2)
	}

	static draw(ctx) {
		for (let c of this.citizens) c.drawHighlight(ctx)
		for (let c of this.citizens) c.draw(ctx)
		for (let c of this.citizens) c.drawDebbug(ctx)
	}

	static checkChunk(x, y) {
		if (typeof this.chunks == 'undefined') this.chunks = {}
		if (typeof this.chunks[x] == 'undefined') this.chunks[x] = {}
		if (typeof this.chunks[x][y] == 'undefined') this.chunks[x][y] = []
	}

	static removeFromChunk(x, y, citizenIndex) {
		this.checkChunk(x, y)
		let index = this.chunks[x][y].indexOf(citizenIndex)
		this.chunks[x][y].splice(index, 1)
	}

	static addToChunk(x, y, index) {
		this.checkChunk(x, y)
		this.chunks[x][y].push(index)
	}

	static citizensNearByChunk (a, b) {
		let citizens = []
		for (let x = -1; x <= 1; x ++) {
			for (let y = -1; y <= 1; y ++) {
				this.checkChunk(a + x, b + y)

				for (let index of this.chunks[a+x][b+y]) {
					citizens.push(this.citizens[index])
				}
			}
		}
		return citizens
	}

	static powerRangersAssanble() {
		let last = false

		for (let citizen of this.citizens) {
			if (last) citizen.following = last
			last = citizen
		}
	}

	static checkFainted () {
		if (typeof this._fainted == 'undefined') this._fainted = {}
	}

	static fainted () {
		this.checkFainted()
		
		return Object.values(this._fainted)
	}

	static pushFainted (citizen) {
		this.checkFainted()
		
		this._fainted[citizen.index] = citizen
	}

	static removeFainted (citizen) {
		this.checkFainted()
		
		if (typeof this._fainted[citizen.index] == 'undefined') return

		delete this._fainted[citizen.index]
	}
}