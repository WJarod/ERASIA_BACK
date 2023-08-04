
import path from 'path';

function getPathFromRegex(regexp) {
  return regexp
    .toString()
    .replace('/^', '')
    .replace('?(?=\\/|$)/i', '')
    .replace(/\\\//g, '/')
    .replace('(?:/(?=$))', '');
}

function combineStacks(acc, stack) {
  if (stack.handle.stack) {
    const routerPath = getPathFromRegex(stack.regexp);
    return [...acc, ...stack.handle.stack.map((stack) => ({ routerPath, ...stack }))];
  }
  return [...acc, stack];
}

function getStacks(app) {
  // Express 3
  if (app.routes) {
    // convert to express 4
    return Object.keys(app.routes)
      .reduce((acc, method) => [...acc, ...app.routes[method]], [])
      .map((route) => ({ route: { stack: [route] } }));
  }

  // Express 4
  if (app._router && app._router.stack) {
    return app._router.stack.reduce(combineStacks, []);
  }

  // Express 4 Router
  if (app.stack) {
    return app.stack.reduce(combineStacks, []);
  }

  // Express 5
  if (app.router && app.router.stack) {
    return app.router.stack.reduce(combineStacks, []);
  }

  return [];
}

function sortByType(routes) {
  const typeOrder = { GET: 1, POST: 2, PUT: 3, DELETE: 4 };
  return routes.sort((a, b) => typeOrder[a.method] - typeOrder[b.method]);
}

function getGeneratedRoutes(app) {
    const stacks = getStacks(app);
    let generatedRoutes = [];
  
    if (stacks) {
      for (const stack of stacks) {
        if (stack.route) {
          for (const route of stack.route.stack) {
            const method = route.method ? route.method.toUpperCase() : null;
            if (method) {
              const stackPath = path
                .normalize([stack.routerPath, stack.route.path, route.path].filter((s) => !!s).join(''))
                .trim();
              const model = stackPath.split('/')[1];
              generatedRoutes.push({ model, method, path: stackPath });
            }
          }
        }
      }
    }
    generatedRoutes.sort((a, b) => a.model.localeCompare(b.model));
    generatedRoutes = sortByType(generatedRoutes);
    return generatedRoutes;
  }
  
  export default getGeneratedRoutes;