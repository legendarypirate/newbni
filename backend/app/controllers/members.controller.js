"use strict";

const { Op } = require("sequelize");
const db = require("../models");

exports.list = async (req, res) => {
  try {
    const { q, industry, location, verified } = req.query;
    const where = { status: "active" };

    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { company: { [Op.iLike]: `%${q}%` } },
        { industry: { [Op.iLike]: `%${q}%` } },
        { bio: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (industry) {
      where.industry = industry;
    }

    if (location) {
      where[Op.or] = [
        ...(where[Op.or] || []),
        { position: location },
        { company: { [Op.iLike]: `%${location}%` } },
        { bio: { [Op.iLike]: `%${location}%` } },
      ];
    }

    if (verified === "1") {
      where.featured = 1;
    } else if (verified === "0") {
      where.featured = 0;
    }

    const members = await db.LegacyMember.findAll({
      where,
      order: [
        ["featured", "DESC"],
        ["updatedAt", "DESC"],
        ["name", "ASC"],
      ],
    });

    const totalActive = await db.LegacyMember.count({
      where: { status: "active" },
    });

    const featuredMembers = await db.LegacyMember.findAll({
      where: { status: "active", featured: 1 },
      order: [
        ["updatedAt", "DESC"],
        ["name", "ASC"],
      ],
      limit: 4,
    });

    const recentMembers = await db.LegacyMember.findAll({
      where: { status: "active" },
      order: [["updatedAt", "DESC"]],
      limit: 3,
    });

    const allActiveMembers = await db.LegacyMember.findAll({
      where: { status: "active" },
      attributes: ["industry", "position", "bio"],
    });

    return res.json({
      ok: true,
      data: {
        members,
        totalActive,
        featuredMembers,
        recentMembers,
        allActiveMembers,
      },
    });
  } catch (err) {
    console.error("members list failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await db.LegacyMember.findByPk(id);
    if (!member) {
      return res.status(404).json({ ok: false, message: "Member not found" });
    }
    return res.json({ ok: true, data: member });
  } catch (err) {
    console.error("member get failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};
exports.getProfileByAccountId = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await db.PlatformProfile.findByPk(id);
    if (!profile) {
      return res.status(404).json({ ok: false, message: "Profile not found" });
    }
    return res.json({ ok: true, data: profile });
  } catch (err) {
    console.error("profile get failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};

function asRecord(json) {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    return { ...json };
  }
  return {};
}

exports.updateMyProfile = async (req, res) => {
  const accountId = req.user.id;
  const body = req.body || {};

  try {
    const existing = await db.PlatformProfile.findOne({ where: { accountId } });
    const existingBiz = asRecord(existing?.businessJson);

    const industry = String(body.industry ?? "").trim();
    const companySize = String(body.company_size ?? "").trim();
    const foundedYear = String(body.founded_year ?? "").trim();
    const slogan = String(body.slogan ?? "").trim();
    const professionActivity = String(body.profession_activity ?? "").trim();
    const companyLocation = String(body.company_location ?? "").trim();
    const yearsInBusiness = String(body.years_in_business ?? "").trim();
    const previousWork = String(body.previous_work ?? "").trim();
    const facebook = String(body.facebook ?? "").trim();
    const instagram = String(body.instagram ?? "").trim();
    const whatsapp = String(body.whatsapp ?? "").trim();
    const wechat = String(body.wechat ?? "").trim();
    const kakaotalk = String(body.kakaotalk ?? "").trim();
    const viber = String(body.viber ?? "").trim();
    const addressCountry = String(body.address_country ?? "").trim();
    const addressCity = String(body.address_city ?? "").trim();
    const addressDistrict = String(body.address_district ?? "").trim();
    const addressPostal = String(body.address_postal ?? "").trim();
    const contactHours = String(body.contact_hours ?? "").trim();
    const legalForm = String(body.legal_form ?? "").trim();
    const registerNumber = String(body.register_number ?? "").trim();
    const bankCode = String(body.bank_code ?? "").trim();
    const bankName = String(body.bank_name ?? "").trim();
    const bankAccountNumber = String(body.bank_account_number ?? "").trim();

    const mergedBusiness = {
      ...existingBiz,
      industry,
      company_size: companySize,
      founded_year: foundedYear,
      slogan,
      profession_activity: professionActivity,
      company_location: companyLocation,
      years_in_business: yearsInBusiness,
      previous_work: previousWork,
      facebook,
      instagram,
      whatsapp,
      wechat,
      kakaotalk,
      viber,
      address_country: addressCountry,
      address_city: addressCity,
      address_district: addressDistrict,
      address_postal: addressPostal,
      contact_hours: contactHours,
      legal_form: legalForm,
      register_number: registerNumber,
      bank_code: bankCode,
      bank_name: bankName,
      bank_account_number: bankAccountNumber,
    };

    if (body.member_photo_url) mergedBusiness.member_photo_url = body.member_photo_url;
    if (body.profile_cover_url) mergedBusiness.profile_cover_url = body.profile_cover_url;
    if (body.hero_slides) mergedBusiness.hero_slides = body.hero_slides;

    const profileData = {
      displayName: String(body.displayName ?? "").trim() || req.user.email,
      companyName: String(body.companyName ?? "").trim() || null,
      businessPhone: String(body.businessPhone ?? "").trim() || null,
      businessEmail: String(body.businessEmail ?? "").trim() || null,
      website: String(body.website ?? "").trim() || null,
      addressLine: String(body.addressLine ?? "").trim() || null,
      bio: String(body.bio ?? "").trim() || null,
      photoUrl: String(body.photoUrl ?? "").trim() || existing?.photoUrl || null,
      businessJson: mergedBusiness,
    };

    if (existing) {
      await existing.update(profileData);
    } else {
      await db.PlatformProfile.create({ ...profileData, accountId });
    }

    return res.json({ ok: true, displayName: profileData.displayName });
  } catch (err) {
    console.error("updateMyProfile failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};

exports.updateMyHeroSlides = async (req, res) => {
  const accountId = req.user.id;
  const { slides } = req.body || {};

  try {
    const existing = await db.PlatformProfile.findOne({ where: { accountId } });
    const biz = asRecord(existing?.businessJson);
    
    biz.hero_slides = Array.isArray(slides) ? slides : [];

    if (existing) {
      await existing.update({ businessJson: biz });
    } else {
      await db.PlatformProfile.create({
        accountId,
        displayName: req.user.email,
        businessJson: biz,
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("updateMyHeroSlides failed:", err);
    return res.status(500).json({ ok: false, message: "failed" });
  }
};
