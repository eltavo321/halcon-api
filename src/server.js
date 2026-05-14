require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");
const auth = require("./middleware/auth");

const app = express();

/* =========================
   MIDDLEWARES
========================= */

app.use(cors());

app.use(express.json());

app.use(
  "/uploads",
  express.static("uploads")
);

/* =========================
   MULTER
========================= */

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    cb(null, "uploads/");

  },

  filename: (req, file, cb) => {

    cb(

      null,

      Date.now() +
      path.extname(file.originalname)

    );

  }

});

const upload = multer({
  storage
});

/* =========================
   GET ALL ORDERS
========================= */

app.get(
  "/orders",
  auth,

  async (req, res) => {

    try {

      const result = await pool.query(

        `
        SELECT

          o.id,
          o.invoice,
          o.customer,
          o.address,
          o.status,

          (
            SELECT image_url

            FROM public.delivery_photos dp

            WHERE dp.order_id = o.id

            ORDER BY dp.id DESC

            LIMIT 1
          ) AS photo

        FROM public.orders AS o

        ORDER BY o.id ASC
        `

      );

      res.json(result.rows);

    } catch (error) {

      console.log(error);

      res.status(500).json({
        message: "Server error"
      });

    }

  }

);

/* =========================
   GET ORDER BY INVOICE
========================= */

app.get(
  "/orders/:invoice",

  async (req, res) => {

    try {

      const invoice =
        req.params.invoice;

      const result =
        await pool.query(

          `
          SELECT

            o.id,
            o.invoice,
            o.customer,
            o.address,
            o.status,

            (
              SELECT image_url

              FROM public.delivery_photos dp

              WHERE dp.order_id = o.id

              ORDER BY dp.id DESC

              LIMIT 1
            ) AS photo

          FROM public.orders AS o

          WHERE o.invoice = $1
          `,

          [invoice]

        );

      if (
        result.rows.length === 0
      ) {

        return res
          .status(404)
          .json({

            message:
              "Order not found"

          });

      }

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.log(error);

      res.status(500).json({

        message:
          "Server error"

      });

    }

  }

);

/* =========================
   UPDATE ORDER STATUS
========================= */

app.put(
  "/orders/:id",

  auth,

  async (req, res) => {

    try {

      const id =
        req.params.id;

      const {
        status
      } = req.body;

      const result =
        await pool.query(

          `
          UPDATE public.orders

          SET status = $1

          WHERE id = $2

          RETURNING *
          `,

          [
            status,
            id
          ]

        );

      if (
        result.rows.length === 0
      ) {

        return res
          .status(404)
          .json({

            message:
              "Order not found"

          });

      }

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.log(error);

      res.status(500).json({

        message:
          "Server error"

      });

    }

  }

);

/* =========================
   UPLOAD PHOTO
========================= */

app.post(

  "/orders/:id/photo",

  auth,

  upload.single("photo"),

  async (req, res) => {

    try {

      const orderId =
        req.params.id;

      const imageUrl =
        `/uploads/${req.file.filename}`;

      await pool.query(

        `
        INSERT INTO public.delivery_photos (

          order_id,
          image_url

        )

        VALUES ($1, $2)
        `,

        [
          orderId,
          imageUrl
        ]

      );

      res.json({

        imageUrl

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        message:
          "Server error"

      });

    }

  }

);

/* =========================
   LOGIN
========================= */

app.post(
  "/login",

  async (req, res) => {

    try {

      const {
        email,
        password
      } = req.body;

      const result =
        await pool.query(

          `
          SELECT *

          FROM public.users

          WHERE email = $1
          `,

          [email]

        );

      if (
        result.rows.length === 0
      ) {

        return res
          .status(401)
          .json({

            message:
              "Invalid credentials"

          });

      }

      const user =
        result.rows[0];

      if (
        user.password !== password
      ) {

        return res
          .status(401)
          .json({

            message:
              "Invalid credentials"

          });

      }

      const token =
        jwt.sign(

          {
            id: user.id,
            email: user.email
          },

          process.env.JWT_SECRET,

          {
            expiresIn: "7d"
          }

        );

      res.json({

        token,

        user: {

          id: user.id,
          email: user.email,
          name: user.name

        }

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        message:
          "Server error"

      });

    }

  }

);

/* =========================
   SERVER
========================= */

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `API running on port ${PORT}`
  );

});