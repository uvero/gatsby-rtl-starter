const { resolve } = require("path");
const { postsPerPage } = require("../config");

async function createFeed({ edges, createPage, template }) {
  // create feed pages
  const { length } = edges;

  const numPages = Math.ceil(length / postsPerPage);

  const LINK_PREFIX = "/page/";

  for (let i = 0; i < numPages; i += 1) {
    const path = i === 0 ? "/" : `${LINK_PREFIX}${i}`;

    createPage({
      path,
      component: template,
      context: {
        slug: path,
        currentPage: i,
        postsLimit: postsPerPage,
        postsOffset: i * postsPerPage,
        prevPagePath: i <= 1 ? "/" : `${LINK_PREFIX}${i - 1}`,
        nextPagePath: `${LINK_PREFIX}${i + 1}`,
        hasPrevPage: i !== 0,
        hasNextPage: i !== numPages - 1,
      },
    });
  }
}

async function createBlogPages({ createPage, edges, template }) {
  edges.forEach((edge) => {
    const { slug } = edge.node.fields;

    createPage({
      path: slug,
      component: template,
      context: {
        slug,
      },
    });
  });
}

async function createPages({ graphql, actions }) {
  const { createPage } = actions;

  const templatesPath = resolve(__dirname, "../src/templates");

  const notFoundTemplate = resolve(templatesPath, "notFound.js");

  const blogTemplate = resolve(templatesPath, "blog.js");
  const pageTemplate = resolve(templatesPath, "page.js");
  const feedTemplate = resolve(templatesPath, "feed.js");

  // const tagTemplate = resolve(templatesPath, "tag.js");
  // const categoryTemplate = resolve(templatesPath, "category.js");

  // 404
  createPage({
    path: "/404",
    component: resolve(notFoundTemplate),
  });

  // // Tags list
  // createPage({
  //   path: "/tags",
  //   component: tagTemplate,
  // });

  // // Categories list
  // createPage({
  //   path: "/categories",
  //   component: categoryTemplate,
  // });

  const siteData = await graphql(
    `
      {
        allStrapiBlog {
          edges {
            node {
              fields {
                slug
              }
            }
          }
        }

        allStrapiSiteMeta(filter: { slug: { ne: "404" } }) {
          edges {
            node {
              fields {
                slug
              }
            }
          }
        }
      }
    `
  );

  if (siteData.errors) {
    // eslint-disable-next-line no-console
    console.error(siteData.errors);

    throw Error(siteData.errors);
  }

  const {
    data: {
      allStrapiBlog: { edges: apiBlog },
      allStrapiSiteMeta: { edges: apiPages },
    },
  } = siteData;

  // blog
  await createBlogPages({ createPage, edges: apiBlog, template: blogTemplate });

  // feed
  await createFeed({ createPage, edges: apiBlog, template: feedTemplate });

  // pages
  await createBlogPages({
    createPage,
    edges: apiPages,
    template: pageTemplate,
  });
}

module.exports = createPages;
