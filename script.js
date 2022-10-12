'use strict';

const API = 'https://pokeapi.co/api/v2';

let allPokemons = {
    count: undefined,
    pokemons: [],
};

let pokemonsFiltered = {
    count: undefined,
    pokemons: [],
};

let pokemonsLoaded = {
    nextIndex: 0,
    pokemons: [],
};

const fetchData = async (url) => {
    const res = await fetch(url);
    const data = await res.json();
    return data;
};

const getPokemon = async (url) => {
    const pokemon = await fetchData(url);
    return {
        id: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprites.front_default,
        url: url,
    };
};

const getAllPokemons = async (
    api = 'https://pokeapi.co/api/v2',
    limit = 100000,
    offset = 0
) => {
    const data = await fetchData(
        `${api}/pokemon?limit=${limit}&offset=${offset}`
    );

    return data;
};

const loadPokemons = async (pokemonsArray, startIndex, endIndex) => {
    let loadedPokemons = [];
    let arrayLastIndex = pokemonsArray.length - 1;

    if (arrayLastIndex < endIndex) endIndex = arrayLastIndex;

    for (let i = startIndex; i <= endIndex; i++) {
        const url = pokemonsArray[i].url;
        const newPokemon = await getPokemon(url);
        loadedPokemons.push(newPokemon);
    }

    return loadedPokemons;
};

const showMorePokemons = async (pokemonsArray, quantity) => {
    //En esta funcion se manejara el loading y posible error, tambien si no se encuentran pokemons y si termino de mostrarlos todos
    const $pokemonsContainer = document.getElementById('pokemons-container');

    let startIndex = pokemonsLoaded.nextIndex;
    let endIndex = pokemonsLoaded.nextIndex + quantity - 1;

    let newPokemons = await loadPokemons(
        pokemonsArray.pokemons,
        startIndex,
        endIndex
    );

    let $newPokemonCards = '';

    pokemonsLoaded.pokemons = [...pokemonsLoaded.pokemons, ...newPokemons];
    pokemonsLoaded.nextIndex = endIndex + 1;

    let arrayLastIndex = pokemonsArray.length - 1;
    if (arrayLastIndex < endIndex) endIndex = arrayLastIndex;

    for (let i = startIndex; i <= endIndex; i++) {
        let pokemon = pokemonsLoaded.pokemons[i];

        $newPokemonCards += `
            <div class="cards__card">
                <img src="${pokemon.sprite}" alt="${pokemon.name}" class="cards__sprite" loading="lazy">
                <h3 class="cards__text cards__text--name">${pokemon.name}</h3>
                <span class="cards__text cards__text--id">${pokemon.id}</span>
            </div>
        `;
    }

    $pokemonsContainer.innerHTML += $newPokemonCards;
};

(async () => {
    if (localStorage.getItem('ALL_POKEMONS')) {
        allPokemons = await JSON.parse(localStorage.getItem('ALL_POKEMONS'));
    } else {
        const { count, results } = await getAllPokemons();
        allPokemons.count = count;
        allPokemons.pokemons = results;
        localStorage.setItem('ALL_POKEMONS', JSON.stringify(allPokemons));
    }

    await showMorePokemons(allPokemons, 20);
    await showMorePokemons(allPokemons, 20);
    await showMorePokemons(allPokemons, 20);
    await showMorePokemons(allPokemons, 20);
})();
