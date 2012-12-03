// taken from: http://stackoverflow.com/questions/979975/how-to-get-the-value-from-url-parameter
function getQueryParams() {
	qs = document.location.search.split("+").join(" ");
	var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;
	while (tokens = re.exec(qs))
	    params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
	return params;
}

function randInt(maxNonInclusive) {
	return Math.floor(Math.random() * maxNonInclusive);
}

function reloadWindow() {
	window.location.reload(); 
}

// taken from: http://viralpatel.net/blogs/javascript-array-remove-element-js-array-delete-element/
function removeByIndex(arr, index) {
    arr.splice(index, 1);
}
function removeByValue(arr, val) {
    for(var i=0; i<arr.length; i++) {
        if(arr[i] == val) {
            arr.splice(i, 1);
            break;
        }
    }
}
