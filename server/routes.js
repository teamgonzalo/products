var router = require("express").Router();
var pg = require("pg");

var connectionString = "postgres://jonathanforcherio:secret@localhost:5432/sdc";

var pgClient = new pg.Client(connectionString);
pgClient.connect();

// use req.params to access parameters in the url
// use req.body to access additional parameters

router.get("/products", (req, res) => {
  var page = req.body.page || 1;
  var count = req.body.count || 5;

  var offset = (page - 1) * count;

  var query = pgClient.query(
    `SELECT * FROM products Order By id LIMIT ${count} OFFSET ${offset}`,
    (err, result) => {
      res.send(result.rows);
    }
  );
});

// produces extra set of quotes around certain columns
router.get("/products/:product_id", (req, res) => {
  var product_id = Number(req.params.product_id.substring(1));

  var query = pgClient.query(
    `SELECT (products.*, features.feature, features.value) FROM features RIGHT JOIN products ON products.id = features.product_id WHERE products.id = ${product_id}`,
    (err, result) => {
      var stringProductResults = result.rows[0].row;
      var arrayProductResults = stringProductResults.split(",");

      //console.log(stringProductResults); // no extra quotes
      //console.log(arrayProductResults); // extra quotes

      var featuresArray = [];
      for (var i = 0; i < result.rows.length; i++) {
        var featureArray = result.rows[i].row.split(",");
        featuresArray.push(
          featureArray[6],
          featureArray[7].substring(0, featureArray[7].length - 1)
        );
      }

      var featuresArrayOfObjects = [];

      for (var j = 0; j < featuresArray.length; j = j + 2) {
        var featuresObject = {};
        featuresObject["feature"] = featuresArray[j];
        featuresObject["value"] = featuresArray[j + 1];
        featuresArrayOfObjects.push(featuresObject);
      }

      var objectResults = {
        id: Number(arrayProductResults[0].substring(1)),
        name: arrayProductResults[1].toString(),
        slogan: arrayProductResults[2],
        description: arrayProductResults[3],
        category: arrayProductResults[4],
        default_price: arrayProductResults[5],
        features: featuresArrayOfObjects,
      };

      res.send(objectResults);
    }
  );
});

router.get("/products/:product_id/styles", (req, res) => {
  var product_id = Number(req.params.product_id.substring(1));

  var query = pgClient.query(
    `
    SELECT row_to_json(sty) as results
    FROM (
      SELECT st.id, st.name, st.original_price, st.sale_price, st.default_style,
      (SELECT json_agg(phot)
        FROM (
          SELECT thumbnail_url, url FROM photos WHERE "styleId" = st.id
        ) phot
      ) as photos,

      (SELECT json_object_agg(id, sku)
        FROM (
          SELECT id, size, quantity FROM skus WHERE "styleId" = st.id
        ) sku
      ) skus
    FROM styles as st
    WHERE st."productId" = ${product_id}) sty

    `,
    (err, result) => {
      console.log(err);

      var results = result.rows;
      results[0]["product_id"] = product_id;

      res.send(result.rows);
    }
  );
});

// returns an array of related products' ids ex: [2, 3, 8, 7]
router.get("/products/:product_id/related", (req, res) => {
  var product_id = Number(req.params.product_id.substring(1));

  var query = pgClient.query(
    `SELECT related_product_id FROM related WHERE current_product_id = ${product_id}`,
    (err, result) => {
      var relatedArray = [];

      for (var i = 0; i < result.rows.length; i++) {
        relatedArray.push(result.rows[i].related_product_id);
      }
      res.send(relatedArray);
    }
  );
});

module.exports = router;
