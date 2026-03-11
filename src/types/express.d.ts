declare namespace Express {
  interface Request {
    authUser?: AuthenticatedRequestUser;
  }
}
