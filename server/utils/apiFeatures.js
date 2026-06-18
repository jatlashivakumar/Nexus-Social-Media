export class APIFeatures {
  constructor(query, queryString) {
    this.query       = query;
    this.queryString = queryString;
  }

  filter() {
    const q = { ...this.queryString };
    ['page','sort','limit','fields','search'].forEach((f) => delete q[f]);
    const str = JSON.stringify(q).replace(/\b(gte|gt|lte|lt)\b/g, (m) => `$${m}`);
    this.query = this.query.find(JSON.parse(str));
    return this;
  }

  sort() {
    this.query = this.query.sort(
      this.queryString.sort ? this.queryString.sort.split(',').join(' ') : '-createdAt'
    );
    return this;
  }

  limitFields() {
    this.query = this.query.select(
      this.queryString.fields ? this.queryString.fields.split(',').join(' ') : '-__v'
    );
    return this;
  }

  paginate(def = 20) {
    const page  = Math.max(+this.queryString.page  || 1, 1);
    const limit = Math.min(+this.queryString.limit || def, 100);
    this.query = this.query.skip((page - 1) * limit).limit(limit);
    this.pagination = { page, limit };
    return this;
  }
}
