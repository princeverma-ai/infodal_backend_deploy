//imports ----------------------------------------------------->
const CourseModel = require("../models/course");
const ApiFeatures = require("../utils/apiFeatures");
const { sendErrorMessage } = require("../utils/errorHandler");

//*SEARCH PLACES - NAME , KEYWORDS

//Exports ---------------------------------------------------->
exports.courseSearch = async (req, res) => {
  try {
    //CHECK IF SEARCH QUERY IS PRESENT
    if (!req.query.search) {
      return sendErrorMessage(res, 400, "Please provide a search query");
    }
    //DIVIDE SEARCH QUERY INTO WORDS
    const words = req.query.search.split(" ");

    //REMOVE EMPTY STRINGS FROM ARRAY
    for (let i = 0; i < words.length; i++) {
      if (words[i] == "") {
        words.splice(i, 1);
        i--;
      }
    }

    //IF SEARCH QUERY IS MORE THAN ONE WORD---------------------------------------------------->
    if (words.length > 1) {
      //MATCH STRING FOR EXACT MATCHING OF SEARCH QUERY
      const matchString = words.join(" ");

      //INITIALIZE QUERY
      const features = new ApiFeatures(
        CourseModel.find({
          $or: [
            {
              name: {
                $in: words.map((word) => new RegExp(word, "i")),
              },
            },
            { keywords: { $in: words } },
            { name: matchString },
          ],
        }),
        req.query
      )
        .filter()
        .sort()
        .limitFields()
        .paginate();

      //EXECUTE QUERY
      const courses = await features.query;

      if (!courses.length) {
        return sendErrorMessage(res, 404, "No courses found");
      }

      return res.status(200).json({
        status: "success",
        page: req.query.page * 1,
        resultsInThisPage: courses.length,
        data: {
          courses,
        },
      });
    }
    //IF SEARCH QUERY IS ONE WORD---------------------------------------------------->
    else {
      //INITIALIZE REGEX TO MATCH WHOLE WORDS TO SEARCH QUERY
      const regex = new RegExp(
        "\\b" + `${req.query.search.trim()}` + "\\b",
        "gi"
      );

      //INITIALIZE QUERY
      const features = new ApiFeatures(
        CourseModel.find({
          $or: [{ name: regex }, { keywords: { $in: regex } }],
        }),
        req.query
      )
        .filter()
        .sort()
        .limitFields()
        .paginate();

      //EXECUTE QUERY
      const courses = await features.query;

      if (!courses.length) {
        return sendErrorMessage(res, 404, "No courses found");
      }

      return res.status(200).json({
        status: "success",
        page: req.query.page * 1,
        resultsInThisPage: courses.length,
        data: {
          courses,
        },
      });
    }
  } catch (err) {
    return sendErrorMessage(res, 400, err.message);
  }
};
