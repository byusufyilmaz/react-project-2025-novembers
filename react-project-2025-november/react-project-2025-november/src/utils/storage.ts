import Cookies from '../utils/cookies';

class Storage {
  static isLocalStorageSupported(): boolean {
    const storage = window.localStorage;
    const testKey = 'testLocalStorageFunctionality';
    let supported = true;

    try {
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
    } catch (error) {
      supported = false;
    }

    return !!supported;
  }

  static get(key: string): any {
    let value: string;
    if (Storage.isLocalStorageSupported()) value = window.localStorage.getItem(key) ?? '';
    else value = Cookies.get(key);

    if (value && value != 'undefined') value = JSON.parse(value);

    return value;
  }

  static set(key: string, data: unknown): void {
    const value = JSON.stringify(data);

    if (Storage.isLocalStorageSupported()) {
      window.localStorage.setItem(key, value);
    } else {
      Cookies.set(key, value);
    }
  }

  static remove(key: string): void {
    if (Storage.isLocalStorageSupported()) {
      window.localStorage.removeItem(key);
    } else {
      Cookies.remove(key);
    }
  }
}

export default Storage;
