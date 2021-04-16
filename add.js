const storeForm = document.getElementById('store-form');
const userId = document.getElementById('user-id')
const storeId = document.getElementById('store-id');
const storeAddress = document.getElementById('store-address');

// Send POST to API to add store
async function addStore(e) {
    e.preventDefault();

    if (storeId.value === '' || storeAddress.value === '') {
        alert('Please fill in fields');
    }

    const sendBody = {
        storeId: storeId.value, //users self input name for store
        address: storeAddress.value, //address
        userId: userId.value //users id to match to store
    };

    try {
        const res = await fetch('/api/v1/stores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sendBody)
        });

        if (res.status === 400) {
            throw Error('Store already exists!');
        }

        alert('Store added!');
       // window.location.href = '/main/users/' + userId.value + '/viewstores';
    } catch (err) {
        alert(err);
        return;
    }
}

storeForm.addEventListener('submit', addStore);