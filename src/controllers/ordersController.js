let orders = [

  {
    id:1,
    invoice:"INV-001",
    customer:"María García",
    address:"Cancún",
    status:"delivered",
    photo:""
  },

  {
    id:2,
    invoice:"INV-002",
    customer:"Carlos Rodríguez",
    address:"Playa del Carmen",
    status:"in_route",
    photo:""
  },

  {
    id:3,
    invoice:"INV-003",
    customer:"Ana López",
    address:"Tulum",
    status:"in_process",
    photo:""
  }

];

const getOrders =
(req,res)=>{

  res.json(orders);

};

const updateOrder =
(req,res)=>{

  const id =
    Number(req.params.id);

  const {
    status,
    photo
  } = req.body;

  orders =
    orders.map(order=>{

      if(order.id === id){

        return {

          ...order,

          status:
            status || order.status,

          photo:
            photo || order.photo

        };

      }

      return order;

    });

  res.json({
    message:
      "Order updated"
  });

};

module.exports = {
  getOrders,
  updateOrder
};