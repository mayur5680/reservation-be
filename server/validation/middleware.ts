export const TrimData = (req: any, res: any, next: any): any => {
  try {
    let { name, description, email, lastName, title, mobileNo } = req.body;
    if (name) name = name.trim();
    if (lastName) lastName = lastName.trim();
    if (email) email = email.trim();
    if (description) description = description.trim();
    if (title) title = title.trim();
    if (mobileNo) mobileNo = mobileNo.trim();

    req.body = { ...req.body, name, email, description, title, mobileNo };
    return next();
  } catch (error) {
    throw error;
  }
};
