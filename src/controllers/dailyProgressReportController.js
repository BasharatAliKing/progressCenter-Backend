import DailyProgress from "../models/dailyProgressReport.js";

export const createDailyProgress = async (req, res) => {
  try {

    let photos = [];

    if (req.files) {
      photos = req.files.map((file) => ({
        img_name: file.originalname,
        img_path: file.path
      }));
    }

    const progress = new DailyProgress({
      ...req.body,
      progressPhotos: photos
    });

    const saved = await progress.save();

    res.status(201).json(saved);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllDailyProgress = async (req, res) => {
  try {

    const data = await DailyProgress.find();

    res.json(data);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDailyProgressById = async (req, res) => {
  try {

    const data = await DailyProgress.find({project_id:req.params.id});

    res.status(200).json({message:"Progress By Id Fetch Successfully.",data});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDailyProgress = async (req, res) => {
  try {

    const data = await DailyProgress.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(data);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDailyProgress = async (req, res) => {
  try {

    await DailyProgress.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted Successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};