'use strict';

/**
 * Collection of utility methods.
 */
const Util = {

    /**
     * Trims slashes on either end of a string.
     *
     * @param {string} string The string.
     * @return {string} The trimmed string.
     */
    trimSlashes: (string) => {
        let cleanString = string;

        if (Util.endsWith(cleanString, '/')) {
            cleanString = cleanString.substring(0, cleanString.length - 1);
        }

        if (Util.startsWith(cleanString, '/')) {
            cleanString = cleanString.substring(1, cleanString.length);
        }

        return cleanString;
    },

    /**
     * Combines two url strings, with a '/' in between if required.
     *
     * @param {string} route The base route.
     * @param {string} subRoute The route to add to the base route.
     * @return {string} The combined route.
     */
    combineUrls: (route, subRoute) => {
        const cleanRoute = Util.trimSlashes(route);
        const cleanSubRoute = Util.trimSlashes(subRoute);

        if (cleanRoute.length !== 0 && cleanSubRoute.length !== 0) {
            return `${cleanRoute}/${cleanSubRoute}`;
        } else if (cleanRoute.length === 0) {
            return cleanSubRoute;
        } else {
            return cleanRoute;
        }
    },

    /**
     * Determines if a string ends with a string.
     *
     * @param {string} str The string to check.
     * @param {string} suffix The suffix we're checking for.
     * @return {boolean} true if the string ends with the string, false otherwise.
     */
    endsWith: (str, suffix) => {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    },

    /**
     * Determines if a string starts with a string.
     *
     * @param {string} str The string to check.
     * @param {string} prefix The prefix we're checking for.
     * @return {boolean} true if the string starts with the string, false otherwise.
     */
    startsWith: (str, prefix) => {
        return str.lastIndexOf(prefix, 0) === 0;
    },

    /**
     * Determines if a parameter is a function.
     *
     * @param {*} obj The parameter to check.
     * @return {boolean} True if function, false otherwise.
     */
    isFunction: (obj) => {
        return typeof obj === 'function';
    },

    /**
     * Determines if a parameter is a string.
     *
     * @param {*} str The parameter to check.
     * @return {boolean} True if string, false otherwise.
     */
    isString: (str) => {
        return typeof str === 'string';
    },

    /**
     * Determines if a parameter is an array.
     *
     * @param {*} arr The parameter to check.
     * @return {boolean} True if array, false otherwise.
     */
    isArray: (arr) => {
        return Array.isArray(arr);
    },

    /**
     * Determines if a parameter is an object.
     *
     * @param {*} obj The parameter to check.
     * @return {boolean} True if object, false otherwise.
     */
    isObject: (obj) => {
        return typeof obj === 'object';
    },

    /**
     * Loops over object keys.
     *
     * @param {object} object The object.
     * @param {function} iterator The iterator function, called with (key, value)
     */
    forEach: (object, iterator) => {
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                iterator(key, object[key]);
            }
        }
    },

    /**
     * Determines if a parameter is undefined.
     *
     * @param {*} val The parameter to check.
     * @return {boolean} True if undefined, false otherwise.
     */
    isUndefined: (value) => {
        return typeof value === 'undefined';
    }
};

module.exports = Util;
