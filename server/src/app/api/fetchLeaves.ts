import { HandModel } from '../models/hand.model';

export async function fetchLeavesSummary(req, res) {
  // Logic to retrieve list of users that have leaves in HandModel

  try {
    const hands = await HandModel.find()
      .select('playerName createdAt')
      .sort({ timestamp: 1 });

    // Send the response with the list of users
    res.json(hands);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
}
