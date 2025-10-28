import _ from 'lodash';

type Obj = Record<string, any> 
    | Record<string, any>[] 
    | [] 
    | string 
    | number
export default function toCamelCaseKeys(obj: Obj): Obj {
    if (Array.isArray(obj)) {
        return obj.map((item: Obj) => toCamelCaseKeys(item));
    } else if (obj !== null && obj.constructor === Object && typeof obj === 'object') {
	return Object.keys(obj).reduce((result: Record<string, any>, key: string) => {
	    const camelKey: string = _.camelCase(key);
	    result[camelKey] = toCamelCaseKeys(obj[key]);
	    return result;
	}, {});
    }
    return obj;
};
