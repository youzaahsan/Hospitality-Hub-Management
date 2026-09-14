import { Request, Response } from 'express';
import { Feedback, logActivity, createNotification } from '../db/db';

export async function getFeedback(req: Request, res: Response): Promise<void> {
  try {
    const list = await Feedback.find({});
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate genuine aggregated statistics
    const totalReviews = list.length;
    let sumRating = 0;
    let sumCleanliness = 0;
    let sumStaff = 0;
    let sumComfort = 0;
    let sumFacilities = 0;
    let sumValue = 0;
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    for (const fb of list) {
      sumRating += fb.rating || 5;
      const roundedStar = Math.min(5, Math.max(1, Math.round(fb.rating || 5)));
      distribution[roundedStar] = (distribution[roundedStar] || 0) + 1;

      if (fb.categories) {
        sumCleanliness += fb.categories.cleanliness || 5;
        sumStaff += fb.categories.staff || 5;
        sumComfort += fb.categories.comfort || 5;
        sumFacilities += fb.categories.facilities || 5;
        sumValue += fb.categories.valueForMoney || 5;
      }
    }

    const averageRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 5.0;
    const categoryAverages = {
      cleanliness: totalReviews > 0 ? Number((sumCleanliness / totalReviews).toFixed(1)) : 5.0,
      staff: totalReviews > 0 ? Number((sumStaff / totalReviews).toFixed(1)) : 5.0,
      comfort: totalReviews > 0 ? Number((sumComfort / totalReviews).toFixed(1)) : 5.0,
      facilities: totalReviews > 0 ? Number((sumFacilities / totalReviews).toFixed(1)) : 5.0,
      valueForMoney: totalReviews > 0 ? Number((sumValue / totalReviews).toFixed(1)) : 5.0,
    };

    res.json({
      success: true,
      stats: {
        totalReviews,
        averageRating,
        categoryAverages,
        distribution,
      },
      data: list,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch feedback.' });
  }
}

export async function submitFeedback(req: Request, res: Response): Promise<void> {
  try {
    const {
      guestName,
      guestEmail,
      reservationId,
      rating = 5,
      categories,
      title,
      comment,
    } = req.body;

    if (!guestName || !comment) {
      res.status(400).json({ success: false, message: 'Guest name and review comment are required.' });
      return;
    }

    const validRating = Math.min(5, Math.max(1, Number(rating) || 5));
    const feedback = await Feedback.create({
      reservationId,
      guestId: req.user?._id,
      guestName,
      guestEmail: guestEmail || req.user?.email || '',
      rating: validRating,
      categories: {
        cleanliness: categories?.cleanliness || validRating,
        staff: categories?.staff || validRating,
        comfort: categories?.comfort || validRating,
        facilities: categories?.facilities || validRating,
        valueForMoney: categories?.valueForMoney || validRating,
      },
      title: title || 'Exceptional Stay',
      comment,
      isPublished: true,
    });

    await logActivity({
      userName: guestName,
      userRole: req.user?.role || 'guest',
      action: 'FEEDBACK_SUBMITTED',
      entityType: 'guest',
      entityId: feedback._id,
      details: `Guest ${guestName} submitted a ${validRating}-star rating: "${title}".`,
    });

    await createNotification({
      targetRole: 'all',
      title: 'New Guest Review Received',
      message: `${guestName} rated their stay ${validRating}/5 stars.`,
      type: 'info',
    });

    res.status(201).json({ success: true, message: 'Thank you for your feedback.', data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
  }
}

export async function respondToFeedback(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response) {
      res.status(400).json({ success: false, message: 'Response text is required.' });
      return;
    }

    const updated = await Feedback.findByIdAndUpdate(id, {
      response,
      respondedBy: req.user?.name || 'General Manager',
      respondedAt: new Date().toISOString(),
    });

    if (!updated) {
      res.status(404).json({ success: false, message: 'Feedback not found.' });
      return;
    }

    res.json({ success: true, message: 'Response saved.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to respond to feedback.' });
  }
}
