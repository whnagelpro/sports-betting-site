const featureStore = new Map();

export function saveFeatures(playerId, features) {

    featureStore.set(playerId, features);

}

export function getFeatures(playerId) {

    return featureStore.get(playerId);

}

export function hasFeatures(playerId) {

    return featureStore.has(playerId);

}

export function clearFeatureStore() {

    featureStore.clear();

}