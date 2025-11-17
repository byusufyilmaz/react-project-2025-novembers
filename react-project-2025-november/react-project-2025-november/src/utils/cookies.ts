/* eslint-disable no-useless-escape */
interface CookiesOptions {
  path?: string;
  domain?: string;
  expires?: Date | number | string;
  'max-age'?: string | number;
  secure?: boolean;
  samesite?: string;
  httpOnly?: boolean;
}

class Cookies {
  static get(name: string): string {
    const matches = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
    );
    return matches ? decodeURIComponent(matches[1]) : '';
  }

  static set(name: string, val: string, opts?: CookiesOptions): void {
    const options: any = opts || ({} as CookiesOptions);

    if (!options.path) {
      options.path = '/';
    }

    let { expires } = options;

    if (typeof expires === 'number' && expires) {
      const d = new Date();
      d.setTime(d.getTime() + expires * 1000);
      expires = d;
      options.expires = d;
    }

    if (expires instanceof Date && expires?.toUTCString) {
      options.expires = expires.toUTCString();
    }

    const value = encodeURIComponent(val);

    let updatedCookie = `${name}=${value}`;

    Object.keys(options).forEach((propName) => {
      updatedCookie += `; ${propName}`;

      const propValue = options[propName];
      if (propValue !== true) {
        updatedCookie += `= ${propValue}`;
      }
    });

    document.cookie = updatedCookie;
  }

  static remove(name: string): void {
    Cookies.set(name, '', {
      expires: -1,
    });
  }
}

export default Cookies;
