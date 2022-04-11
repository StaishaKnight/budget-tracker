let db;

// db connection
const request = indexedDB.open('budget-tracker', 1);

// create object  in db
request.onupgradeneeded = function(event) {
	const db = event.target.result;
	db.createObjectStore('new_transaction', { autoIncrement: true });
};

// when connection to db 
request.onsuccess = function(event) {
	db = event.target.result;

  // check if app is online
	if (navigator.onLine) {
		uploadTransaction();
	}
};

request.onerror = function(event) {
	console.log(event.target.errorCode);
};


// save if no internet connection
function saveRecord(record) {
  // open new transaction
  const transaction = db.transaction([ 'new_transaction'], 'readwrite');
  
  const transObjectStore = transaction.objectStore('new_transaction');
  transObjectStore.add(record);
}

// upload indexDB data to server mongoDB 
function uploadTransaction() {
  // new transaction with db
  const transaction = db.transaction([ 'new_transaction' ], 'readwrite');


  const transObjectStore = transaction.objectStore('new_transaction');

  //  get all records
  const getAll = transObjectStore.getAll();


  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body    : JSON.stringify(getAll.result),
				headers : {
					Accept         : 'application/json, text/plain, */*',
					'Content-Type' : 'application/json'
				}
      })
      .then((response) => response.json())
				.then((serverResponse) => {
					if (serverResponse.message) {
						throw new Error(serverResponse);
          }
          
					// open one more transaction
					const transaction = db.transaction([ 'new_transaction' ], 'readwrite');
					
					const transObjectStore = transaction.objectStore('new_transaction');
				
					transObjectStore.clear();

					alert('All saved transactions have been submitted');
				})
				.catch((err) => {
					console.log(err);
				});
    }
  }
}

window.addEventListener('online', uploadTransaction);