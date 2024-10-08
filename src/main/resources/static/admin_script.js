async function auth() {
    let res = await fetch('http://localhost:8080/admin/api/auth');
    return await res.json();
}

// Нажатие на кнопку Edit в таблице юзеров
async function onEditButton(button) {
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        const tr = button.parentNode.parentNode;
        const userId = tr.children[0].innerHTML;
        const userEmail = tr.children[1].innerHTML;
        const userName = tr.children[2].innerHTML;
        const userCompany = tr.children[3].innerHTML;
        const userRoles = Array.from(tr.children[4].children).map(role => role.innerHTML);

        document.querySelector('#editId').value = userId;
        document.querySelector('#editEmail').value = userEmail;
        document.querySelector('#editName').value = userName;
        document.querySelector('#editCompany').value = userCompany;
        document.querySelector('#editPassword').value = '';

        // Загрузка всех ролей и выбор текущих ролей пользователя
        let roles = await fetch("http://localhost:8080/admin/api/roles");
        roles = await roles.json();
        const rolesSelect = document.querySelector('#editRoles');
        rolesSelect.innerHTML = ''; // Очистка существующих опций

        roles.forEach(role => {
            let option = document.createElement("option");
            option.value = role.id;
            option.text = role.role.substring(5, role.role.length);
            if (userRoles.includes(option.text)) {
                option.selected = true;
            }
            rolesSelect.appendChild(option);
        });

        const editModal = new bootstrap.Modal(document.getElementById('editModal'));
        editModal.show();
    });
}

// Нажатие на кнопку Delete в таблице юзеров
function onDeleteButton(button) {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('#deleteRoles').innerHTML = '';

        const tr = button.parentNode.parentNode;
        document.querySelector('#deleteId').value = tr.children[0].innerHTML;
        document.querySelector('#deleteEmail').value = tr.children[1].innerHTML;
        document.querySelector('#deleteName').value = tr.children[2].innerHTML;
        document.querySelector('#deleteCompany').value = tr.children[3].innerHTML;

        let roles = Array.from(tr.children[4].children).map(role => role.innerHTML);
        roles.forEach(role => {
            let option = document.createElement('option');
            option.text = role;
            document.querySelector('#deleteRoles').appendChild(option);
        });

        const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        deleteModal.show();
    });
}

// Модальное окно Edit
async function EditModal() {
    let roles = await fetch("http://localhost:8080/admin/api/roles");
    roles = await roles.json();
    roles.forEach(role => {
        if (document.querySelector('#editRoles').children.length < 3) {
            let option = document.createElement("option");
            option.value = role.id;
            option.text = role.role.substring(5, role.role.length);
            document.querySelector('#editRoles').appendChild(option);
        }
    });

    document.querySelector('#editBtnSubmit').addEventListener('click', async (e) => {
        e.preventDefault();
        const url = `http://localhost:8080/admin/api/edit/${document.querySelector('#editId').value}`;
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: document.querySelector('#editId').value,
                email: document.querySelector('#editEmail').value,
                name: document.querySelector('#editName').value,
                company: document.querySelector('#editCompany').value,
                password: document.querySelector('#editPassword').value,
                roles: listOfRoles(document.querySelector('#editRoles'))
            })
        });

        if (response.ok) {
            console.log('User successfully edited');
            await refreshPage();
            document.querySelector('#editForm').reset();
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
            editModal.hide(); // Закрытие модального окна после успешного редактирования
        } else {
            console.error('Failed to edit user');
        }
    });
}

// Модальное окно Delete
async function DeleteModal() {
    document.querySelector('.deleteSubmit').addEventListener('click', async (e) => {
        e.preventDefault();
        const userId = document.querySelector('#deleteId').value;

        // Получаем текущего аутентифицированного пользователя
        const currentUser = await auth();

        // Проверяем, пытается ли администратор удалить себя
        if (currentUser.id === parseInt(userId)) {
            alert("You cannot delete yourself!");
            return;
        }

        const url = `http://localhost:8080/admin/api/deleteUser/${userId}`;
        try {
            let res = await fetch(url, {
                method: "DELETE",
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!res.ok) {
                console.error(`HTTP error! Status: ${res.status}`);
                return;
            }

            console.log('User successfully deleted');
            await refreshPage();
            document.querySelector('#deleteForm').reset();
            const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            deleteModal.hide(); // Закрытие модального окна после успешного удаления
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    });
}

// Таб нового юзера
async function newUser() {
    if (!document.querySelector('#warning').classList.contains('d-none')) {
        document.querySelector('#warning').classList.add('d-none');
    }

    let roles = await fetch('http://localhost:8080/admin/api/roles');
    roles = await roles.json();
    roles.forEach(role => {
        if (document.querySelector('#roles').children.length < 3) {
            let option = document.createElement("option");
            option.value = role.id;
            option.text = role.role.substring(5, role.role.length);
            document.querySelector('#roles').appendChild(option);
        }
    });

    document.querySelector('#newUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = 'http://localhost:8080/admin/api/new';
        let response = await fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: document.querySelector('#email').value,
                name: document.querySelector('#name').value,
                company: document.querySelector('#company').value,
                password: document.querySelector('#password').value,
                roles: listOfRoles(document.querySelector('#roles'))
            })
        });
        if (response.status === 406) {
            document.querySelector('#warning').classList.remove('d-none');
        } else {
            await refreshPage();
            document.querySelector('a.allUsers').classList.add('active');
            document.querySelector('a.newUser').classList.remove('active');
            document.querySelector('#allUsers').classList.add('active');
            document.querySelector('#newUser').classList.remove('active');
            document.querySelector('#newUserForm').reset();
        }
    });
}

// Заполнение верхней панели
async function upperPanel() {
    let user = await auth();
    document.getElementById("adminUsername").textContent = user.name;
    let roles = "";
    user.roles.forEach(role => {
        roles += role.role.substring(5, role.role.length) + " ";
    });
    document.getElementById("adminRoles").textContent = roles;
}

// Преобразование выбранных option-ов в массив ролей
function listOfRoles(options) {
    let res = [];
    for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
            res.push({id: options[i].value, role: `ROLE_${options[i].text}`});
        }
    }
    return res;
}

// Обновление списка юзеров
async function refreshPage() {
    let response = await fetch("http://localhost:8080/admin/api");
    let users = await response.json();
    document.querySelector('#allUsersTBody').innerHTML = '';
    users.forEach(user => {
        let table = "";
        let roles = user.roles.map(role => role.role.substring(5, role.role.length));
        let rolesInTable = '';
        roles.forEach(role => {
            rolesInTable += `<div>${role}</div>`;
        });
        table += `<tr id="tr${user.id}">
            <td class="align-middle">${user.id}</td>
            <td class="align-middle">${user.email}</td>
            <td class="align-middle">${user.name}</td>
            <td class="align-middle">${user.company}</td>            
            <td class="align-middle">${rolesInTable}</td>
            <td class="align-middle"><button class="btn btn-primary btn-sm editBtn" data-bs-toggle="modal" data-bs-target="#editModal">Edit</button></td>
            <td class="align-middle"><button class="btn btn-danger btn-sm deleteBtn" data-bs-toggle="modal" data-bs-target="#deleteModal">Delete</button></td>
            </tr>`;
        document.querySelector('#allUsersTBody').innerHTML += table;
    });
    document.querySelectorAll('.editBtn').forEach(btn => {
        onEditButton(btn);
    });
    document.querySelectorAll('.deleteBtn').forEach(btn => {
        onDeleteButton(btn);
    });

    // Проверка количества администраторов и скрытие кнопки удаления, если остался только один
    fetch('/admin/api/admin-count')
        .then(response => response.json())
        .then(adminCount => {
            if (adminCount <= 1 && users.length === 1) {
                document.querySelectorAll('.deleteBtn').forEach(btn => {
                    btn.disabled = true;
                    btn.classList.add('btn-secondary');
                    btn.classList.remove('btn-danger');
                });
            } else {
                document.querySelectorAll('.deleteBtn').forEach(btn => {
                    btn.disabled = false;
                    btn.classList.add('btn-danger');
                    btn.classList.remove('btn-secondary');
                });
            }
        })
        .catch(error => console.error('Error fetching admin count:', error));

    await upperPanel();
    await refreshUserPanel();
}

// Обновление панели юзера
async function refreshUserPanel() {
    const tbody = document.querySelector('#userTBody');

    let user = await auth();
    let roles = user.roles.map(role => role.role.substring(5, role.role.length));
    let rolesInTable = '';
    roles.forEach(role => {
        rolesInTable += `<div>${role}</div>`;
    });

    tbody.innerHTML = `<tr>
            <td class="align-middle">${user.id}</td>
            <td class="align-middle">${user.email}</td>
            <td class="align-middle">${user.name}</td>
            <td class="align-middle">${user.company}</td>
            <td class="align-middle">${rolesInTable}</td>
            </tr>`;
}

// Обработчик событий закрытия модальных окон
function setupModalCloseHandlers() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
        });
    });
}

// Вызов функций после определения и загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    refreshPage();
    EditModal();
    DeleteModal();
    newUser();
    setupModalCloseHandlers();
});