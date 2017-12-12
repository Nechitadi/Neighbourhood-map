(function () {
    const selectDealer = document.querySelector('#select-dealer');
    // const searchField = document.querySelector('#search-keyword');
    let searchedForText;
    const responseContainer = document.querySelector('#response-container');

    selectDealer.addEventListener('change', function (e) {
        e.preventDefault();
        responseContainer.innerHTML = '';
        searchedForText = selectDealer.value;
        
        fetch(`https://api.unsplash.com/search/photos?page=1&query=${searchedForText}`, {
            headers: {
                Authorization: 'Client-ID 781462b1cdaa1360fd9d5f1bd281302f269e474eee731ad612eb2a2654ca9f93'
            }
        }).then(response => response.json())
        .then(addImage)
        .catch(e => requestError(e, 'image'));

        function addImage(images) {
            let htmlContent = '';
            let data = images;
            if(data && data.results && data.results[0]) {
                const firstImage = images.results[0];
                htmlContent = `<figure>
                    <img src="${firstImage.urls.regular}" alt="${searchedForText}">
                    <figcaption>${searchedForText} by ${firstImage.user.name}</figcaption>
                </figure>`;
            } else {
                htmlContent = '<div class="error-no-image">No images available</div>';
            }
            responseContainer.insertAdjacentHTML('afterbegin', htmlContent);
        }

        function requestError(e, part) {
            console.log(e);
            responseContainer.insertAdjacentHTML('beforeend', `<p class="network-warning">Oh no! There was an error making a request for the ${part}.</p>`);
        }

        const articleURL = `https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${searchedForText}&api-key=ab66b214d5634f06923b9fe4f1f5184c`;
        fetch(articleURL).then(response => response.json()).then(addArticles)
        .catch(e => requestError(e, 'articles'));
        function addArticles(data) {
            let htmlContent = '';

            if(data.response && data.response.docs && data.response.docs[0]) {
                const articles = data.response.docs;
                let articlesHtml = '';
                data.response.docs.map(article => articlesHtml += `<li class="article"><h2><a href="${article.web_url}">${article.headline.main}</a></h2><p>${article.snippet}</p><p id="nyt-signature">article by New York Times</p></li>`) + '</ul>';
                htmlContent = '<ul>' + articlesHtml + '</ul>';
            } else {
                htmlContent = `<div class="error-no-articles">No articles available</div>`;
            }
            responseContainer.insertAdjacentHTML('beforeend', htmlContent);
        }
    });
})();
