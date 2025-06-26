// @todo: напишите здесь код парсера

function parseMeta() {
    const meta = {}

    const title = document.querySelector('head title').textContent
    const titleClean = title.split('—')[0].trim()
    meta.title = titleClean

    const description = document.querySelector('meta[name="description"]').getAttribute('content')
    meta.description = description

    const keywordsString = document.querySelector('meta[name="keywords"]').getAttribute('content')
    const keywordsArr = keywordsString.split(',').map(keyword => keyword.trim())
    meta.keywords = keywordsArr

    const language = document.querySelector('html').getAttribute('lang')
    meta.language = language

    function parseOpengraphLocal() {
        const opengraph = {}

        const title = document.querySelector('meta[property="og:title"]').getAttribute('content')
        const titleClean = title.split('—')[0].trim()
        opengraph.title = titleClean

        const image = document.querySelector('meta[property="og:image"]').getAttribute('content')
        opengraph.image = image

        const type = document.querySelector('meta[property="og:type"]').getAttribute('content')
        opengraph.type = type

        return opengraph
    }
    meta.opengraph = parseOpengraph()

    return meta
}

function parseOpengraph() {
    const opengraph = {}

    // селекторы атрибутов (=, ^=, $=, ~=, *=, |=)
    const ogFields = document.querySelectorAll('meta[property^="og:"]')
    ogFields.forEach(field => {
        const key = field.getAttribute('property').replace('og:', '')
        const value = field.getAttribute('content')
        opengraph[key] = key === 'title' ? value.split('—')[0].trim() : value
        // if (key === 'title') {
        //     opengraph[key] = value.split('—')[0].trim()
        // } else {
        //     opengraph[key] = value
        // }
    })

    return opengraph
}

function parseProduct() {
    const product = {}
    const productSection = document.querySelector('section.product')

    const id = productSection.dataset.id
    product.id = id

    const name = productSection.querySelector('.about .title').textContent
    product.name = name.trim()

    const likeButton = productSection.querySelector('button.like')
    product.isLiked = likeButton.classList.contains('active')

    product.tags = parseProductTags()

    // product = {
    //     ...product,
    //     ...parsePrices()
    // }; // потребует сделать product не const а let
    Object.assign(product, parseProductPrices(
        productSection.querySelector('.price')
    ))

    product.properties = parseProductProperties()

    // const description = productSection.querySelector('.description').innerHTML.trim()
    // product.description = description
    const description = productSection.querySelector('.description')
    description.querySelector('h3').removeAttribute('class')
    // description.querySelectorAll('*').forEach(element => {
    //     [...element.attributes].forEach(attr => element.removeAttribute(attr))
    // }) // Удаляем все атрибуты, почему не работает?
    product.description = description.innerHTML.trim()

    product.images = parseProductImages()

    return product
}

function parseProductTags() {
    const tags = {}
    const tagsBlock = document.querySelector('section.product .about .tags')

    // // оборачиваем NodeList (возвращаемый querySelectorAll) в Array
    // // const category = Array.from(tagsBlock.querySelectorAll('.green')).map(tag => tag.textContent)
    // const category = [...tagsBlock.querySelectorAll('.green')].map(tag => tag.textContent)
    // tags.category = category
    // const discount = [...tagsBlock.querySelectorAll('.red')].map(tag => tag.textContent)
    // tags.discount = discount
    // const label = [...tagsBlock.querySelectorAll('.blue')].map(tag => tag.textContent)
    // tags.label = label

    const tagSelectors = {
        category: '.green',
        discount: '.red',
        label: '.blue'
    }
    for (const [tag, classSelector] of Object.entries(tagSelectors)) {
        tags[tag] = [...tagsBlock.querySelectorAll(classSelector)]
            .map(tag => tag.textContent.trim())
    }

    return tags
}

function parseProductPrices(targetBlock) {
    const prices = {}
    const priceBlock = targetBlock

    const price = priceBlock.firstChild.textContent.trim()
    const priceClean = +price.replace(/\D/g, '') // Удалит все, кроме цифр и сделает числом
    prices.price = priceClean

    if (priceBlock.querySelector('span')) {
        const oldPrice = priceBlock.querySelector('span').textContent.trim()
        const oldPriceClean = +oldPrice.replace(/\D/g, '')
        prices.oldPrice = oldPriceClean

        if (oldPriceClean && oldPriceClean > priceClean) {
            prices.discount = oldPriceClean - priceClean
            prices.discountPercent = (prices.discount * 100 / oldPriceClean).toFixed(2) + '%'
        } else {
            prices.discount = 0
            prices.discountPercent = '0%'
        }
    }

    const currencySymbols = {
        '$': 'USD',
        '€': 'EUR',
        '₽': 'RUB'
    }
    prices.currency = currencySymbols[price[0]] || 'n/a';
    // // Если искать валюту в любом месте строки
    // const currencyMatch = price.match(/[$€₽]/);
    // prices.currency = currencyMatch ? currencySymbols[currencyMatch[0]] : 'n/a';

    return prices
}

function parseProductProperties() {
    const properties = {}
    const propertiesBlock = document.querySelectorAll('section.product .properties li')

    // Внимание: firstChild и children[0] совсем не одно и тоже:
    // firstChild это тип узла, включая текстовые (#text), переносы строки и т.д
    // children[0] безопасно возвращает только элементы, игнорируя текстовые узлы и переносы
    propertiesBlock.forEach(child => {
        properties[child.children[0].textContent.trim()] = child.children[1].textContent.trim()
    })
    // propertiesBlock.forEach(child => {
    //     const [keySpan, valueSpan] = child.children;
    //     const key = keySpan.textContent.trim();
    //     const value = valueSpan.textContent.trim();
    //     properties[key] = value;
    // });

    return properties
}

function parseProductImages() {
    const images = []

    const imagesBlock = document.querySelectorAll('section.product .preview nav img')
    imagesBlock.forEach(img => {
        const image = {
            preview: img.getAttribute('src'),
            full: img.dataset.src,
            alt: img.getAttribute('alt')
        }
        images.push(image)
    })

    return images
}

function parseSuggested() {
    const suggested = []
  
    const suggestedBlock = document.querySelectorAll('section.suggested .items article')

    suggestedBlock.forEach(child => {
        const suggest = {
            name: child.querySelector('h3').textContent.trim(),
            description: child.querySelector('p').textContent.trim(),
            image: child.querySelector('img').getAttribute('src'),
            price: parseProductPrices(child.querySelector('b')).price.toString(),
            currency: parseProductPrices(child.querySelector('b')).currency
            // Распаковать все поля обьекта, уверен это более правильно, но в
            // задании price хотят вернуть как строку ???
            // ...parseProductPrices(child.querySelector('b'))
        }
        suggested.push(suggest)
    })

    return suggested
}

function parseReviews() {
    const reviews = []

    const reviewsBlock = document.querySelectorAll('section.reviews .items article')

    reviewsBlock.forEach(article => {
        const review = {
            rating: article.querySelectorAll('.rating span.filled').length,
            author: {
                avatar: article.querySelector('.author img').getAttribute('src'),
                name: article.querySelector('.author span').textContent.trim()
            },
            title: article.querySelector('h3.title').textContent.trim(),
            // селектор типа "следующий сосед" - на случай если будет несколько разных <p>
            description: article.querySelector('h3.title + p').textContent.trim(),
            // руками заменяем слеши на точки в дате
            date: article.querySelector('.author i').textContent.trim().replace(/\//g, '.')
        }
        reviews.push(review)
    })

    return reviews
}

function parsePage() {
    return {
        meta: parseMeta(),
        product: parseProduct(),
        suggested: parseSuggested(),
        reviews: parseReviews()
    };
}

window.parsePage = parsePage;