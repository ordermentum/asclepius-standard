# asclepius-standard

standard configuration for asclepius

## Healthchecks

- redis
- elasticsearch
- sequelize (postgresql)
- process


## Usage

```javascript
const { setup } = require('asclepius-standard');

setup({ sequelize, redis, elasticsearch });
```
