import { jwtDecode } from "jwt-decode";

class JWTToken {
  static getDecodeToken(token: string) {
    return jwtDecode(token);
  }

  static getExpiryTime(token: string) {
    const jwt: any = jwtDecode(token);
    return jwt.exp;
  }

  static isTokenExpired(token: string): boolean {
    const jwt: any = jwtDecode(token);
    const expiryTime: any = jwt.exp;
    if (expiryTime) {
      return 1000 * expiryTime - new Date().getTime() < 5000;
    } else {
      return false;
    }
  }
}

export default JWTToken;
