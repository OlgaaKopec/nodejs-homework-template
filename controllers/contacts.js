const Joi = require("joi");
const contactService = require("../service/index.js");

const schema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } }).required(),
  phone: Joi.string().required(),
});

const get = async (req, res, next) => {
  try {
    const contacts = await contactService.getAllContacts();
    res.json({
      status: 200,
      data: { contacts },
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const contactId = req.params.contactId;
    const contact = await contactService.getContactById(contactId);
    if (contact) {
      res.json({
        status: 200,
        data: { contact },
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "Not found",
      });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const create = async (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    res.status(400).json({
      status: 400,
      message: error.message,
    });
  } else {
    try {
      const newContact = await contactService.createContact(req.body);
      res.json({
        status: 201,
        data: { newContact },
      });
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
};

const update = async (req, res, next) => {
  const contactId = req.params.contactId;
  const { error } = schema.validate(req.body);
  if (error) {
    res.status(400).json({
      status: 400,
      message: error.message,
    });
  } else {
    try {
      const updatedContact = await contactService.updateContact(contactId, req.body);
      if (updatedContact) {
        res.json({
          status: 200,
          data: { updatedContact },
        });
      } else {
        res.status(404).json({
          status: 404,
          message: "Not found",
        });
      }
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
};

const remove = async (req, res, next) => {
  try {
    const contactId = req.params.contactId;
    const removedContact = await contactService.removeContact(contactId);
    if (removedContact) {
      res.json({
        status: 200,
        message: "contact deleted",
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "Not found",
      });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  const contactId = req.params.contactId;
  const { favorite } = req.body;
  if (favorite === undefined) {
    res.status(400).json({
      status: 400,
      message: "missing field favorite",
    });
  } else {
    try {
      const updatedContact = await contactService.updateContact(contactId, { favorite });
      if (updatedContact) {
        res.json({
          status: 200,
          data: { updatedContact },
        });
      } else {
        res.status(404).json({
          status: 404,
          message: "Not found",
        });
      }
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
};

module.exports = {
  get,
  getById,
  create,
  update,
  remove,
  updateStatus,
};
