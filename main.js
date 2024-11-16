const CANVAS_SIZE = 700
const TILE_SIZE = 70
const V_360_DEG = Math.PI * 2
const V_180_DEG = Math.PI
const V_10_DEG = Math.PI / 18

tiles()

let canvas = document.querySelector('#habitat')
let ctx = canvas.getContext('2d')

let w = canvas.width = CANVAS_SIZE
let h = canvas.height = CANVAS_SIZE

// ...

Citizen.get_n_random(10)
Food.get_n_random(7)
// new Citizen(w/2, h/2)

Citizen.setBoundaries(0, 0, w, h)

let pin = false

function draw() {
	Food.draw(ctx)
	Citizen.draw(ctx)

	if (pin) {
		ctx.save()
		ctx.translate(pin.x, pin.y)

		ctx.strokeStyle = 'red'

		ctx.beginPath()
		ctx.moveTo(-10, -10)
		ctx.lineTo(10, 10)
		ctx.stroke()

		ctx.beginPath()
		ctx.moveTo(-10, 10)
		ctx.lineTo(10, -10)
		ctx.stroke()

		ctx.restore()
	}
}

function process() {
	Citizen.process()
	Food.process()

	Citizen.citizens[0].highlight = true
}

// ...

canvas.addEventListener('click', function (e) {
	let x = e.offsetX
	let y = e.offsetY
	pin = {x, y}
	Citizen.setPin(pin)
})

canvas.addEventListener('contextmenu', function (e) {
	e.preventDefault()
	pin = false
	Citizen.unsetPin()
})

// ...

setInterval(process, 100)

function frame () {
	ctx.clearRect(0, 0, w, h)
	draw()
	window.requestAnimationFrame(frame)
}

frame()