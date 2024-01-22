import { HandModel } from '../models/hand.model';

export async function fetchLeaf(req, res) {
  // Logic to retrieve list of users that have leaves in HandModel

  try {
    const id = req.params.id;
    const hand = await HandModel.findById(id).lean();

    // Send the response with the list of users
    res.json(hand);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
}
