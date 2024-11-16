function tiles () {
	let canvas = document.querySelector('#tiles')
	let ctx = canvas.getContext('2d')

	let w = canvas.width = CANVAS_SIZE
	let h = canvas.height = CANVAS_SIZE

	let tiles_row = Math.floor(w / TILE_SIZE)
	let tiles_col = Math.floor(h / TILE_SIZE)

	let is_dark_title = false

	for(let x = 0; x < tiles_row; x++) {

		is_dark_title = x % 2 == 0

		for(let y = 0; y < tiles_col; y++) {
			let true_x = x * TILE_SIZE
			let true_y = y * TILE_SIZE

			ctx.fillStyle = is_dark_title ? "#eeeeee" : "#f5f5f5"

			ctx.fillRect(true_x, true_y, TILE_SIZE, TILE_SIZE)

			is_dark_title = !is_dark_title
		}
	}

	ctx.strokeStyle = 'skyblue'
	ctx.beginPath()
	ctx.arc(350, 350, TILE_SIZE, 0, V_360_DEG)
	ctx.stroke()
}