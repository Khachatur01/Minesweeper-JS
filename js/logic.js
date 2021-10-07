window.onload = function(){
	var newGameButton = document.getElementById("newGame");
	var sizeInput = document.getElementById("size");
	var levelInput = document.getElementById("level");

	newGameButton.addEventListener('click', event => {
		var size = parseInt(sizeInput.value);
		var level = parseInt(levelInput.value);
		new Game(size, level);
	});
}

class Game{
	constructor(size, level){
		if(size < 5)
			size = 5;
		this.gameOver = false;
		this.win = false;
		this.view = new View(size);
		this.model = new Model(size, level);

		this.view.setFlagsCount(0);
		this.view.setMaxFlagsCount(this.model.minesCount);

		for(const button of this.view.buttons){
			button.addEventListener('click', event => {
				this.openListener(button)
			});
			button.addEventListener('contextmenu', event => {
				this.flagListener(button)
				event.preventDefault();
			});
		}
	}

	openListener(button){
		if(this.gameOver || this.win)
			return;

		var indexes = button.id.split("-");
		var i = parseInt(indexes[0]);
		var j = parseInt(indexes[1]);

		if(this.model.board[i][j] > 0 || this.model.flags.isFlag(i, j)) // if opened or flag then don't open
			return;

		if(this.model.board[i][j] == this.model.MINE){
			this.#openAllMines();
			this.#gameOver();
		} else {
			this.#openBlankNeighbours(i, j);
		}
	}

	flagListener(button){
		//if you lose or flags count equals to mines count
		if(this.gameOver || this.win)
			return;

		var indexes = button.id.split("-");
		var i = parseInt(indexes[0]);
		var j = parseInt(indexes[1]);

		if(this.model.board[i][j] > 0) // if opened then don't add flag
			return;

		if(this.model.flags.isFlag(i, j)){
			this.model.flags.remove(i, j);
			this.view.removeFlag(button.id);
		}
		else if(this.model.minesCount != this.model.flags.count()){
			this.model.flags.add(i, j);
			this.view.setFlag(button.id);
		}

		this.view.setFlagsCount(this.model.flags.count());

		if(this.model.win()){
			this.win = true;
			this.view.win();
		}

		return false;
	}

	#openBlankNeighbours(i, j){
		this.model.setMinesCount(i, j);
		this.model.openBlankNeighbours(i, j);

		for(var i = 0; i < this.model.size; i++){
			for(var j = 0; j < this.model.size; j++){
				if(this.model.flags.isFlag(i, j))
					continue;
				if(this.model.board[i][j] == 0)
					this.view.open(i + "-" + j);
				else if(this.model.board[i][j] > 0)
					this.view.setNeighbourMinesCount(i + "-" + j, this.model.board[i][j]);
			}
		}

	}

	#openAllMines(){
		for(var i = 0; i < this.model.size; i++)
			for(var j = 0; j < this.model.size; j++)
				if(this.model.board[i][j] == this.model.MINE)
					this.view.openMine(i + "-" + j);		
	}

	#gameOver(){
		this.gameOver = true;
		this.view.gameOver();
	}
}

class View{
	constructor(size){
		this.size = size;
		this.buttons = new Array();
		this.boardTable = document.getElementById("board");
		this.flagsCount = document.getElementById("flagsCount");
		this.maxFlagsCount = document.getElementById("maxFlagsCount");
		this.message = document.getElementById("message");
		this.flags = document.getElementById("flags");

		this.flags.setAttribute("class", "show");
		this.message.setAttribute("class", "hide");

		this.boardTable.innerHTML = "";
		this.#boardInit();
		
	}

	setFlagsCount(count){
		this.flagsCount.innerHTML = count;
	}
	setMaxFlagsCount(count){
		this.maxFlagsCount.innerHTML = count;
	}


	gameOver(){
		this.message.setAttribute("class", "lose");
	}

	win(){
		this.message.setAttribute("class", "win");
	}

	setFlag(id){
		var button = document.getElementById(id);
		button.setAttribute("class", "flag");
	}

	removeFlag(id){
		var button = document.getElementById(id);
		button.setAttribute("class", "closed");
	}
	
	open(id){
		var button = document.getElementById(id);
		button.setAttribute("class", "opened");
	}

	setNeighbourMinesCount(id, count){
		var button = document.getElementById(id);
		button.setAttribute("class", "count");
		button.textContent  = count;
	}

	openMine(id){
		var button = document.getElementById(id);
		button.setAttribute("class", "mine");
	}

	#boardInit(){
		for(var i = 0; i < this.size; i++){
			var tableRow = document.createElement("tr");
			for(var j = 0; j < this.size; j++){
				var button = document.createElement("button");
				button.id = i + "-" + j;
				button.setAttribute("class", "closed");
				button.style.width = "35px";
				button.style.height = "35px";

				this.buttons.push(button);
				var tableElement = document.createElement("th");
				tableElement.append(button);
				tableRow.append(tableElement);
			}
			this.boardTable.append(tableRow);
		}
	}
}

class Model{
	constructor(size, level){
		this.BLANK = -1;
		this.MINE = -2;
		this.OPENED = -3;
		this.FLAG = -4;
		this.MAX_LEVEL = 10;
		this.MIN_LEVEL = 1;
		this.COEFFICIENT = 0.3;
		this.minesCount = 0;
		this.flags = new Flags();

		this.size = size;
		this.#boardInit();
		if(level > this.MAX_LEVEL)
			level = this.MAX_LEVEL;
		else if(level < this.MIN_LEVEL)
			level = this.MIN_LEVEL;

		var filled = this.#fillMines(level);
		while(!filled)
			filled = this.#fillMines(level);
	}
	win(){
		if(this.flags.count() == this.minesCount && this.flags.allMines(this.board, this.MINE))
			return true;
		else
			return false;
	}

	setFlag(i, j){
		this.flags.add(i, j);
	}
	removeFlag(i, j){
		this.flags.remove(i, j);
	}

	#boardInit(){
		this.board = new Array();
		for(var i = 0; i < this.size; i++){
			this.board.push(new Array());
			for(var j = 0; j < this.size; j++){
				this.board[i].push(this.BLANK);
			}
		}
	}
	#fillMines(level){
		for(var i = 0; i < this.size; i++){
			for(var j = 0; j < this.size; j++){
				var probability = Math.random() * this.MAX_LEVEL-level + 1;
				if(probability < this.COEFFICIENT){
					this.board[i][j] = this.MINE;
					this.minesCount++;
				}
			}
		}
		if(this.minesCount == 0 || this.minesCount == this.size)
			return false;
		return true;
	}

	setMinesCount(i, j){
		this.board[i][j] = this.mineNeighboursCount(i, j);
	}
	mineNeighboursCount(i, j){
		var count = 0;
		if(this.board[i][j] != this.BLANK)
			return this.OPENED;

		for(var row = i - 1; row <= i + 1; row++){
			for(var col = j - 1; col <= j + 1; col++){
				if(row < 0 || col < 0 || row >= this.size || col >= this.size)
					continue
				if(row == i && col == j)
					continue;

				if(this.board[row][col] == this.MINE)
					count++;
			}
		}
			
		return count;
	}
	blankNeighboursList(i, j){
		var blankNeighboursList = new Array();
		for(var row = i - 1; row <= i + 1; row++){
			for(var col = j - 1; col <= j + 1; col++){
				if(row < 0 || col < 0 || row >= this.size || col >= this.size)
					continue
				if(row == i && col == j)
					continue;

				if(this.board[row][col] == this.BLANK){
					var neighbour = new Array();
					neighbour.push(row);
					neighbour.push(col);
					blankNeighboursList.push(neighbour);
				}
			}
		}
		return blankNeighboursList
	}

	openBlankNeighbours(i, j){
		var blankNeighboursList = this.blankNeighboursList(i, j);
		if(blankNeighboursList.length == 0)
			return;

		for(const blankNeighbour of blankNeighboursList){
			var row = blankNeighbour[0];
			var col = blankNeighbour[1];

			if(this.flags.isFlag(row, col))
				continue;

			var count = this.mineNeighboursCount(row, col);
			if(count == this.OPENED)
				continue;

			this.board[row][col] = count;
			if(count == 0)
				this.openBlankNeighbours(row, col);
		}
	}
}

class Flags{
	constructor(){
		this.flags = new Array();
	}

	add(i, j){
		this.flags.push(new Array(i, j));
	}

	remove(i, j){
		for(var index = 0; index < this.flags.length; index++){
			if(this.flags[index][0] == i && this.flags[index][1] == j){
				this.flags.splice(index, 1);
				return true;
			}
		}
		return false;
	}

	isFlag(i, j){
		for(var index = 0; index < this.flags.length; index++)
			if(this.flags[index][0] == i && this.flags[index][1] == j)
				return true;

		return false;
	}
	count(){
		return this.flags.length;
	}
	allMines(board, mine){
		for(const flag of this.flags){
			var i = flag[0];
			var j = flag[1];
			if(board[i][j] != mine)
				return false;
		}
		return true;
	}
}