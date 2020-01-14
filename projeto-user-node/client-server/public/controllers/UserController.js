class UserController {

	constructor(formIdCreate, formIdUpdate, tableId) {

		this.formCreateEl = document.getElementById(formIdCreate);

		this.formUpdateEl = document.getElementById(formIdUpdate);

		this.updateBtn = this.formUpdateEl.querySelector("[type=submit]");

		this.createBtn = this.formCreateEl.querySelector("[type=submit]");

		this.tableEl = document.getElementById(tableId);

		this.onSubmit();

		this.onEdit();

		this.selectAll();

	}//closing constructor

	onEdit() {

		document.querySelector(".btn-cancel").addEventListener("click", e => {

			this.showPanelCreate();

		});

		this.formUpdateEl.addEventListener("submit", e => {

			e.preventDefault();

			this.updateBtn.disabled = true;

			let values = this.getValues(this.formUpdateEl);

			let index = this.formUpdateEl.dataset.trIndex;

			let tr = this.tableEl.querySelector('tbody').rows[index];

			let userOld = JSON.parse(tr.dataset.user);

			let result = Object.assign({}, userOld, values);

			this.getPhoto(this.formUpdateEl).then(
				
				content => {

					if (!values.photo) {

						result._photo = userOld._photo;

					} else {

						result._photo = content;

					}

					let user = new User();

					user.loadFromJSON(result);

					user.save().then(user => {

						tr = this.getTr(user, tr);

						this.addEventsTr(tr);

						this.updateCount();

						this.updateBtn.disabled = false;

						this.formUpdateEl.reset();

						this.showPanelCreate();
						
					});

				},

				e => {

					console.error(e);

				}
			);

		});

	}//closing onEditCancel

	getTr(dataUser, tr = null) {

		if (tr === null) tr = document.createElement("tr");

		tr.dataset.user = JSON.stringify(dataUser);

		tr.innerHTML = `
				<tr>
					<td><img src="${ dataUser.photo }" alt="User Image" class="img-circle img-sm"></td>
					<td>${ dataUser.name }</td>
					<td>${ dataUser.email }</td>
					<td>${ (dataUser.admin) ? 'Sim' : 'Não' }</td>
					<td>${ Utils.dateFormat(dataUser.register) }</td>
					<td>
						<button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
						<button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
					</td>
				</tr>
			`;

			this.addEventsTr(tr);

			return tr;

	}

	onSubmit() {

		this.formCreateEl.addEventListener("submit", e => {

			e.preventDefault();

			this.createBtn.disabled = true;

			let values = this.getValues(this.formCreateEl);

			if (!values) return false;

			this.getPhoto(this.formCreateEl).then(
				
				content => {

					values.photo = content;

					values.save().then(user => {

						this.addLine(user);

						this.formCreateEl.reset();

						this.createBtn.disabled = false;

					});

				},

				e => {

					console.error(e);

				}
			);

		});

	}//closing onSubmit

	getPhoto(formEl) {

		return new Promise((resolve, reject) => {

			let fileReader = new FileReader();

			let elements = [...formEl.elements].filter(item => {

				if (item.name === "photo") {

					return item;

				}

			});

			let file = elements[0].files[0];

			fileReader.onload = () => {

				resolve(fileReader.result);

			}

			fileReader.onerror = e => {

				reject(e);

			}

			if (file) {

				fileReader.readAsDataURL(file);

			} else {

				resolve("dist/img/boxed-bg.png");

			}

		});

	}//closing getPhotos

	getValues(formEl) {

		let user = {};

		let isValid = true;

		[...formEl.elements].forEach( (element, index) => {

			if (['name', 'email', 'password'].indexOf(element.name) > -1 && !element.value) {

				element.parentElement.classList.add("has-error");

				isValid = false;

			}

			if (element.name === "gender") {

				if (element.checked) {

					user[element.name] = element.value;

				}

			} else if (element.name == "admin") {

				user[element.name] = element.checked;

			} else {

				user[element.name] = element.value;

			}

		});

		if (!isValid) {

			this.createBtn.disabled = false;

			return false;

		}

		return new User(
			user.name,
			user.gender,
			user.birth,
			user.country,
			user.email,
			user.password,
			user.photo,
			user.admin
		);

	}//closing getValues

	selectAll() {

		User.getUsersStorage().then(data => {

			data.users.forEach(data => {

				let user = new User();

				user.loadFromJSON(data);

				this.addLine(user);

			});

		});

	}//closing selectAll

	addLine(dataUser, tableId) {

		let tr = this.getTr(dataUser);

		this.tableEl.querySelector("tbody").appendChild(tr);

		this.updateCount();

	}//closing addLine

	addEventsTr(tr) {

		tr.querySelector(".btn-delete").addEventListener('click', e  => {

			if (confirm("Deseja realmente excluir?")) {

				let user = new User();

				user.loadFromJSON(JSON.parse(tr.dataset.user));

				user.remove().then(data => {

					tr.remove();

					this.updateCount();

				});

			}

		});

		tr.querySelector(".btn-edit").addEventListener('click', e  => {

			let json = JSON.parse(tr.dataset.user);

			this.formUpdateEl.dataset.trIndex = tr.sectionRowIndex;

			for (let name in json) {

				let field = this.formUpdateEl.querySelector("[name=" + name.replace("_", "") + "]");

				if (field) {

					switch (field.type) {

						case "file":

							continue
							
							break;

						case "radio":

							field = this.formUpdateEl.querySelector("[name=" + name.replace("_", "") + "][value=" + json[name] + "]");

							field.checked = true;
							
							break;

						case "checkbox":

							field.checked = json[name];
							
							break;
						
						default:

							field.value = json[name];

							break;
					}

				}

			}

			this.formUpdateEl.querySelector(".photo").src = json._photo;

			this.showPanelUpdate();

		});


	}//closing addEventsTr

	showPanelCreate() {

		document.getElementById("box-user-create").style.display = "block";

		document.getElementById("box-user-update").style.display = "none";

	}//closing showPanelCreate

	showPanelUpdate() {

		document.getElementById("box-user-create").style.display = "none";

		document.getElementById("box-user-update").style.display = "block";

	}//closing showPanelUpdate

	updateCount() {

		let numberUsers = 0;

		let numberAdms  = 0;

		[...this.tableEl.querySelector('tbody').children].forEach( tr => {

			numberUsers++;

			let user = JSON.parse(tr.dataset.user);

			if (user._admin) numberAdms++;

		});

		document.getElementById("numberUsers").innerHTML = numberUsers;

		document.getElementById("numberUsersAdm").innerHTML = numberAdms;

	}//closing updateCount

}//closing classe